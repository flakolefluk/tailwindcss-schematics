import { Tree, SchematicsException } from '@angular-devkit/schematics';

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

export function getWorkspace(tree: Tree): Workspace {
  if (!tree.exists('angular.json')) {
    throw new SchematicsException(
      'Could not find Angular workspace configuration',
    );
  }
  
  try {
    return JSON.parse(tree.read(`angular.json`)!.toString()) as Workspace;
  } catch (e) {
    throw new SchematicsException('Error parsing Workspace');
  }
}

export function getProject(workspace: Workspace, name: string): Project {
  const projects = workspace.projects;

  if (!Object.keys(projects).includes(name)) {
    throw new SchematicsException('Project not found');
  }

  return projects[name];
}

export function getProjectRoot(project: Project): string {
  return project.sourceRoot ? `/${project.sourceRoot}` : `/${project.root}/src`;
}

export function getProjectStylesFormat(project: Project) {
  if (
    project.schematics &&
    project.schematics['@schematics/angular:component']
  ) {
    return (
      project.schematics['@schematics/angular:component'].style ||
      project.schematics['@schematics/angular:component'].styleext ||
      'css'
    );
  }
  return 'css';
}

export function getPackageJson(tree: Tree) {
  if (!tree.exists('package.json')) {
    throw new SchematicsException('package.json not found.');
  }

  try {
    return JSON.parse(tree.read('package.json')!.toString()) as PackageJson;
  } catch (e) {
    throw new SchematicsException('Error parsing packageJson');
  }
}
