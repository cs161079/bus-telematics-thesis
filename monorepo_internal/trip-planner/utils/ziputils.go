package ziputil

import (
	"archive/zip"
	"compress/flate"
	"io"
	"io/fs"
	"os"
	"path/filepath"
	"strings"
)

// Zip writes a .zip at destZip containing the given paths.
// Each path is stored under its top-level base name.
func Zip(paths []string, destZip string) error {
	return ZipLevel(paths, destZip, flate.DefaultCompression)
}

// ZipLevel lets you pick compression level: flate.NoCompression, flate.BestSpeed, flate.BestCompression, etc.
func ZipLevel(paths []string, destZip string, level int) error {
	out, err := os.Create(destZip)
	if err != nil {
		return err
	}
	defer out.Close()

	zw := zip.NewWriter(out)
	defer zw.Close()

	// Set global deflate level
	zw.RegisterCompressor(zip.Deflate, func(w io.Writer) (io.WriteCloser, error) {
		return flate.NewWriter(w, level)
	})

	for _, root := range paths {
		root = filepath.Clean(root)
		if err := addPath(zw, root); err != nil {
			return err
		}
	}
	return nil
}

func addPath(zw *zip.Writer, root string) error {
	base := filepath.Base(root)

	return filepath.WalkDir(root, func(p string, d fs.DirEntry, walkErr error) error {
		if walkErr != nil {
			return walkErr
		}
		info, err := d.Info()
		if err != nil {
			return err
		}

		var name string
		if p == root {
			name = base
		} else {
			rel, err := filepath.Rel(filepath.Dir(root), p) // keeps top-level base
			if err != nil {
				return err
			}
			name = rel
		}
		// ZIP requires forward slashes
		name = filepath.ToSlash(name)

		// Directories: ensure trailing slash and no payload
		if info.IsDir() {
			if !strings.HasSuffix(name, "/") {
				name += "/"
			}
			hdr, err := zip.FileInfoHeader(info)
			if err != nil {
				return err
			}
			hdr.Name = name
			hdr.Method = zip.Store
			hdr.SetMode(info.Mode())
			_, err = zw.CreateHeader(hdr) // creates empty dir entry (keeps empty dirs)
			return err
		}

		// Symlink: store link target as file content with symlink mode
		if info.Mode()&os.ModeSymlink != 0 {
			target, err := os.Readlink(p)
			if err != nil {
				return err
			}
			hdr, err := zip.FileInfoHeader(info)
			if err != nil {
				return err
			}
			hdr.Name = name
			hdr.Method = zip.Store
			hdr.SetMode(info.Mode())
			w, err := zw.CreateHeader(hdr)
			if err != nil {
				return err
			}
			_, err = io.WriteString(w, target)
			return err
		}

		// Regular file
		hdr, err := zip.FileInfoHeader(info)
		if err != nil {
			return err
		}
		hdr.Name = name
		hdr.Method = zip.Deflate
		hdr.SetMode(info.Mode())
		// hdr.Modified = info.ModTime() // (Go sets this by default; uncomment if you want to be explicit)

		w, err := zw.CreateHeader(hdr)
		if err != nil {
			return err
		}
		f, err := os.Open(p)
		if err != nil {
			return err
		}
		_, copyErr := io.Copy(w, f)
		closeErr := f.Close()
		if copyErr != nil {
			return copyErr
		}
		return closeErr
	})
}
