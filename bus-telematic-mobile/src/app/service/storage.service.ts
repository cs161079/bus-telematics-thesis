import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';

@Injectable({
    providedIn: 'root'
})
export class StorageService {
    constructor(
        private storage: Storage
    ) {

    }

    async initStorage() {
        await this.storage.create();
    }

    getValue(key: string) {
        return this.storage.get(key);
    }

    setValue(key: string, value: any): any {
        return this.storage.set(key, value);
    }

    removeValue(key: string) {
        return this.storage.remove(key);
    }

    async containsKey(key: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this.storage.keys().then((kData: any) => {
                let result = false;
                const filtered = kData.filter((vKey: string) => vKey === key);
                //console.log("Im here ", filtered);
                if (filtered.length == 1) {
                    result = true;
                }
                resolve(result);
            })
            .catch((error: any) => {
                reject(false);
            });
        });
    }


    async clearStorage() {
        await this.storage.clear();
    }
}
