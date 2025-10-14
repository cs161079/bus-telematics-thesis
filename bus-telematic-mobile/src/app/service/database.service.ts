import { SQLiteConnection, CapacitorSQLite, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Injectable } from "@angular/core";
import { HttpClient } from '@angular/common/http';
import { Platform } from '@ionic/angular';

const DB_USER = "dbusers";

export class DatabaseService {
  private sqlite:  SQLiteConnection = new SQLiteConnection(CapacitorSQLite)
  private db!: SQLiteDBConnection;

  constructor(
    private httpClt: HttpClient,
    private plt: Platform
  ) {
    this.plt.ready().then(async() => {
      await this.InitializePlugin();
    });
  }

  async InitializePlugin() {
    this.db = await this.sqlite.createConnection(
      DB_USER,
      false,
      "no-encryption",
      1,
      false
    );

    await this.db.open();
    this.seedDatabase();
  }

  private seedDatabase() {
    this.httpClt.get("assets/seed.sql", { responseType: "text" }).subscribe(async (sqlText) => {
        await this.db.execute(sqlText);
    });
  }
}
