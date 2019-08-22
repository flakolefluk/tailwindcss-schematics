export interface Workspace {
    projects: { [name: string]: Project };
    defaultProject: string;
  }
  
  export interface Project {
    architect: {
      build?: any;
      serve?: any;
    };
    schematics?: any;
    sourceRoot?: string;
    root?: string;
  }
  
  export interface PackageJson {
    dependencies?: any;
    devDependencies?: any;
  }
  