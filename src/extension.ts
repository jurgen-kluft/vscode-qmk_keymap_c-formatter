/*---------------------------------------------------------------------------------------------
*  Copyright (c) . All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

'use strict';

import * as vscode from 'vscode';
import * as formatter from './formatter';
import fs = require('fs');
import path = require('path');
import cp = require('child_process');
import { Container } from './container';
import { registerWhatsNew } from './whats-new/commands';

const documentSelector = [
    { language: 'c', scheme: 'file' },
    { language: 'c', scheme: 'untitled' }
];

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    Container.context = context;

    registerWhatsNew();

    vscode.commands.registerCommand('qmkKeymapFormatter.editFormatterParameters', () => {

        checkEngineDefined()
            .then((engineType) => {

                checkEngineParametersDefined(engineType.toString())
                    .then((engineParameters) => {

                        let engineParametersFile: string = engineParameters['engineParameters'];
                        if (engineParametersFile === '') {
                            if (engineType === 'go-qmk-keymap') {
                                vscode.window.showErrorMessage('The "qmkKeymap.formatter.engineParameters" setting is not defined');
                                return;
                            }
                            const optionGenerate = <vscode.MessageItem>{
                                title: "Generate"
                            };
                            vscode.window.showErrorMessage('The "qmkKeymap.formatter.engineParameters" setting is not defined. Would you like to generate the default?', optionGenerate).then(option => {
                                // nothing selected
                                if (typeof option === 'undefined') {
                                    return;
                                }
                                if (option.title === "Generate") {
                                    engineParametersFile = generateDefaultEngineParameters(engineParameters['engine'],
                                        engineParameters['enginePath']);
                                    vscode.workspace.openTextDocument(engineParametersFile).then(doc => {
                                        vscode.window.showTextDocument(doc);
                                    });
                                } else {
                                    return;
                                }
                            });
                        } else {
                            vscode.workspace.openTextDocument(engineParametersFile).then(doc => {
                                vscode.window.showTextDocument(doc);
                            });
                        }
                    })
                    .catch((error) => {
                        vscode.window.showErrorMessage(error);
                    });
            })
            .catch((error) => {
                //reject(error);
                vscode.window.setStatusBarMessage('checkEngineDefined: ' + error, 5000);
            });

        function generateDefaultEngineParameters(engine: string, enginePath: string): string {

            let configFileName: string;

            if (engine === 'go-qmk-keymap') { // can be anyfilename.cfg
                configFileName = path.basename(enginePath, path.extname(enginePath)) + '.cfg';
                configFileName = path.join(path.dirname(enginePath), configFileName);

                const command: string = "\"" + enginePath + "\" -g " + configFileName;
                cp.exec(command);
            } else { 
                // error
            }
            return configFileName;
        }
    });

    context.subscriptions.push(vscode.languages.registerDocumentFormattingEditProvider(documentSelector, {
        provideDocumentFormattingEdits: (document, options) => {

            return new Promise((resolve, reject) => {

                checkEngineDefined()
                    .then((engineType) => {

                        checkEngineParametersDefined(engineType.toString())
                            .then((engineParameters) => {

                                const f: formatter.Formatter = new formatter.Formatter(document, options);

                                const range: vscode.Range = new vscode.Range(
                                    0, 0,
                                    document.lineCount,
                                    document.lineAt(document.lineCount - 1).range.end.character
                                );

                                f.format(range, engineParameters['engine'], engineParameters['enginePath'], engineParameters['engineParameters'], engineParameters['formatIndent'])
                                    .then((formattedXml) => {
                                        resolve([new vscode.TextEdit(range, formattedXml.toString())]);
                                    })
                                    .catch((error) => {
                                        console.log('format: ' + error);
                                        vscode.window.showErrorMessage('Error while formatting: ' + error);
                                    });
                            })
                            .catch((error) => {
                                //vscode.window.setStatusBarMessage('checkEngineParametersDefined: ' + error, 5000);
                                vscode.window.showErrorMessage(error);
                            });

                    })
                    .catch((error) => {
                        //reject(error);
                        vscode.window.setStatusBarMessage('checkEngineDefined: ' + error, 5000);
                    });
            });
        }
    }));

    context.subscriptions.push(vscode.languages.registerDocumentRangeFormattingEditProvider(documentSelector, {
        provideDocumentRangeFormattingEdits: (document, range, options) => {

            return new Promise((resolve, reject) => {

                checkEngineDefined()
                    .then((engineType) => {

                        if (!engineSupportsRange(engineType.toString(), document, range)) {
                            reject('The selected engine "' + engineType.toString() + '" does not support selection.');
                            return;
                        }

                        checkEngineParametersDefined(engineType.toString())
                            .then((engineParameters) => {

                                const f: formatter.Formatter = new formatter.Formatter(document, options);
                                f.format(range, engineParameters['engine'], engineParameters['enginePath'], engineParameters['engineParameters'], engineParameters['formatIndent'])
                                    .then((formattedXml) => {
                                        resolve([new vscode.TextEdit(range, formattedXml.toString())]);
                                    })
                                    .catch((error) => {
                                        console.log('format: ' + error);
                                        vscode.window.showErrorMessage('Error while formatting: ' + error);
                                    });
                            })
                            .catch((error) => {
                                //vscode.window.setStatusBarMessage('checkEngineParametersDefined: ' + error, 5000);
                                vscode.window.showErrorMessage(error);
                            });

                    })
                    .catch((error) => {
                        //reject(error);
                        vscode.window.setStatusBarMessage('checkEngineDefined: ' + error, 5000);
                    });
            });
        }
    }));


    function checkEngineDefined() {

        return new Promise((resolve, reject) => {

            const engineType: string = vscode.workspace.getConfiguration('qmkKeymap').get('formatter.engine', '');
            if (engineType === '') {
                const optionGO = <vscode.MessageItem>{
                    title: "golang qmk keymap.c formatter"
                };
                vscode.window.showErrorMessage('The "qmkKeymap.formatter.engine" setting is not defined. Do you want to download some formatter tool first?', optionGO).then(option => {
                    // nothing selected
                    if (typeof option === 'undefined') {
                        reject('undefined');
                        return;
                    }

                    switch (option.title) {
                        case optionGO.title:
                            vscode.env.openExternal(vscode.Uri.parse("http://github.com/jurgen-kluft/go-qmk-keymap"));
                            break;

                        default:
                            break;
                    }
                    reject('hyperlink');
                });
            } else {
                resolve(engineType);
            }
        });
    }



    function checkEngineParametersDefined(engine: string) {

        return new Promise((resolve, reject) => {

            const enginePath: string = vscode.workspace.getConfiguration('qmkKeymap').get('formatter.enginePath', '');
            if (enginePath === '') {
                reject('The "qmkKeymap.formatter.enginePath" setting is not defined. Please configure.');
                return;
            }

            const engineParameters: string = vscode.workspace.getConfiguration('qmkKeymap').get('formatter.engineParameters', '');

            const formatIndent: number = vscode.workspace.getConfiguration('qmkKeymap').get('format.indent', 0);

            resolve({
                'engine': engine,
                'enginePath': enginePath,
                'engineParameters': engineParameters,
                'formatIndent': formatIndent
            });
        });
    }

    function engineSupportsRange(engine: string, document: vscode.TextDocument, range: vscode.Range): boolean {

        if (engine === 'go-qmk-keymap') {
            return true;
        } else { // unsupported
            return false;
        }
    }
}
