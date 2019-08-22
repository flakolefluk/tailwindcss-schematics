import {
  Rule,
  SchematicContext,
  Tree,
  SchematicsException,
} from '@angular-devkit/schematics';
import {
  NodePackageInstallTask,
  RunSchematicTask,
} from '@angular-devkit/schematics/tasks';
import { NgAddOptions } from './schema';
import { getPackageJson, getWorkspace } from '../common/utils';

export function ngAdd(options: NgAddOptions): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const workspace = getWorkspace(tree);
    const packageJson = getPackageJson(tree);
    const projectName = options.project || workspace.defaultProject;

    const coreVersion: string = packageJson.dependencies['@angular/core'];

    if (!coreVersion) {
      throw new SchematicsException(
        'Could not find @angular/core version in package.json.',
      );
    }

    const majorVersion: number = parseInt(
      coreVersion.split('.')[0].replace(/\D/g, ''),
      10,
    );

    if (majorVersion < 8) {
      throw new SchematicsException('Minimum version requirement not met.');
    }

    const setupId = context.addTask(
      new RunSchematicTask('ng-add-setup', {project: projectName }),
    );

    if(!options.skipInstall){
      context.addTask(new NodePackageInstallTask(), [setupId]);
    }
  };
}
