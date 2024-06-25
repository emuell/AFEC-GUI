import * as mobx from 'mobx';
import * as path from '@tauri-apps/api/path'

import { File } from './models/file';
import { Database } from './controllers/database';

import { createPlot, PlotEntry } from './controllers/backend/plot';
import { generateWaveform, WaveformPoint } from './controllers/backend/waveform';
import { isRunningInTauriDev } from './controllers/tools';

// -------------------------------------------------------------------------------------------------

/*!
 * Global application state and controller
!*/

class AppState {

  // database
  @mobx.observable
  databasePath: string = "";

  @mobx.observable
  databaseError: string = "";

  @mobx.observable
  isLoadingDatabase: number = 0;

  @mobx.observable
  isLoadingFiles: number = 0;

  // selected file
  @mobx.observable
  selectedFilePath: string = "";

  @mobx.observable
  isGeneratingWaveform: number = 0;

  // map generation
  @mobx.observable
  isGeneratingMap: number = 0;

  @mobx.observable
  mapEpochs: number = isRunningInTauriDev() ? 100 : 1000;

  @mobx.observable
  mapPerplexity: number = 10;

  @mobx.observable
  mapTheta: number = 0.5;

  // audio playback
  @mobx.observable
  autoPlayFilesInGrid: boolean = true;

  @mobx.observable
  autoPlayFilesInList: boolean = true;

  // initialize app state
  constructor() {
    mobx.makeObservable(this);
  }

  // change the currently selected file in the database
  @mobx.action
  setSelectedFilePath(path: string) {
    this.selectedFilePath = path;
  }

  // open a new database
  @mobx.action
  async openDatabase(filename: string): Promise<void> {
    ++this.isLoadingDatabase;
    try {
      this.selectedFilePath = "";
      await this._database.open(filename);
      mobx.runInAction(() => {
        this.databasePath = filename;
        this.databaseError = "";
      });
    }
    catch (err) {
      mobx.runInAction(() => {
        this.databasePath = filename;
        this.databaseError = (err as any).message || String(err);
      })
      throw err;
    }
    finally {
      mobx.runInAction(() => {
        --this.isLoadingDatabase;
      });
    }
  }

  // access class names from the currently database
  get databaseClassNames(): string[] {
    return this._database.classNames;
  }

  // access category names from the currently database
  get databaseCategoryNames(): string[] {
    return this._database.categoryNames;
  }

  // get a normalized abs path for the given file path.
  // When the file path is relative, prefix it with the DB path, 
  // else return the path as it is, normalized. 
  async databaseFilePath(filePath: string): Promise<string> {
    if (!filePath) {
      return "";
    }
    let absPath = await path.normalize(filePath);
    if (! await path.isAbsolute(absPath)) {
      let dirname = await path.dirname(this.databasePath);
      absPath = await path.join(dirname, absPath);
    }
    return absPath;
  }

  // fetch files at \param rootPath
  @mobx.action
  async fetchFiles(rootPath: string): Promise<File[]> {
    ++this.isLoadingFiles;
    try {
      return await this._database.fetchFiles(rootPath);
    }
    finally {
      mobx.runInAction(() => {
        --this.isLoadingFiles;
      });
    }
  }

  // calculate a mono waveform for selected file
  @mobx.action
  async generateWaveform(width: number): Promise<WaveformPoint[]> {
    if (!this.databasePath || this.databaseError || !this.selectedFilePath) {
      return Promise.reject(new Error("No file selected"));
    }

    ++this.isGeneratingWaveform;
    try {
      let filePath = await this.databaseFilePath(this.selectedFilePath);
      let results = await generateWaveform(filePath, width);
      mobx.runInAction(() => {
        --this.isGeneratingWaveform;
      });
      return results;

    } catch (err) {
      mobx.runInAction(() => {
        --this.isGeneratingWaveform;
      });
      throw err;
    }
  }

  // generate plot for the given database
  @mobx.action
  async generateMap(): Promise<PlotEntry[]> {

    ++this.isGeneratingMap;
    try {
      return await createPlot(this.databasePath, this.mapPerplexity, this.mapTheta, this.mapEpochs);
    }
    finally {
      mobx.runInAction(() => {
        --this.isGeneratingMap;
      });
    }
  }

  private _database = new Database();
}

// -------------------------------------------------------------------------------------------------

export const appState = new AppState();
