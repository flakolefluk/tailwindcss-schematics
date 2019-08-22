import {
  SchematicTestRunner,
  UnitTestTree,
} from '@angular-devkit/schematics/testing';
import * as path from 'path';
import { Tree } from '@angular-devkit/schematics';

const collectionPath = path.join(__dirname, '../collection.json');
const runner = new SchematicTestRunner('schematics', collectionPath);

describe('ng-add', () => {
  const workspaceOptions = {
    name: 'workspace',
    newProjectRoot: 'projects',
    version: '8.0.0',
  };

  const appOptions = {
    name: 'testApp',
    inlineStyle: false,
    inlineTemplate: false,
    routing: false,
    style: 'css',
    skipTests: false,
    skipPackageJson: false,
  };

  let sourceTree: UnitTestTree;

  describe('when in an angular workspace', () => {
    beforeEach(async () => {
      sourceTree = await runner
        .runExternalSchematicAsync(
          '@schematics/angular',
          'workspace',
          workspaceOptions,
        )
        .toPromise();
      sourceTree = await runner
        .runExternalSchematicAsync(
          '@schematics/angular',
          'application',
          appOptions,
          sourceTree,
        )
        .toPromise();
    });

    it('schedules two tasks by default', () => {
      runner.runSchematic('ng-add', { project: 'testApp' }, sourceTree);
      expect(runner.tasks.length).toBe(2);
      expect(runner.tasks.some(task => task.name === 'run-schematic')).toBe(
        true,
      );
      expect(runner.tasks.some(task => task.name === 'node-package')).toBe(
        true,
      );
    });

    it('will not install dependencies if skipInstall is true', () => {
      runner.runSchematic(
        'ng-add',
        { project: 'testApp', skipInstall: true },
        sourceTree,
      );
      expect(runner.tasks.length).toBe(1);
      expect(runner.tasks.some(task => task.name === 'run-schematic')).toBe(
        true,
      );
    });
  });

  describe('when not in an angular workspace', () => {
    it('should throw', () => {
      let errorMessage;
      try {
        runner.runSchematic('ng-add', {}, Tree.empty());
      } catch (e) {
        errorMessage = e.message;
      }
      expect(errorMessage).toMatch(/Could not find Angular workspace configuration/);
    });
  });
});
