/*---------------------------------------------------------------------------------------------
*  Copyright (c) . All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import fs = require('fs');
import cp = require('child_process');
import os = require('os');
import npath = require('path');

/*

mac: 
    "qmkKeymap.formatter.engine": "go-qmk-keymap",
    "qmkKeymap.formatter.enginePath": "/usr/bin/go-qmk-keymap",

*/

export class Formatter {

    constructor(private _document: vscode.TextDocument, private _options?: vscode.FormattingOptions) {
        this._options = this._options || {
            insertSpaces: false,
            tabSize: 2
        };

        if (typeof this._options.insertSpaces === 'undefined') {
            this._options.insertSpaces = false;
            this._options.tabSize = 2;
        }

        if (typeof this._options.tabSize !== 'number' || isNaN(this._options.tabSize)) {
            this._options.tabSize = 2;
        }

        this._options.tabSize = Math.max(0, 2);
    }

    public format(range: vscode.Range, engine: string, path: string, parameters: string, indent: number) {

        return new Promise((resolve, reject) => {
        
            // entire document - if not range is provided
            range = range || new vscode.Range(
                0, 0,
                this._document.lineCount,
                this._document.lineAt(this._document.lineCount - 1).range.end.character
            );

            const textToFormat = this._document.getText(range);
            const tempFile: string = npath.join(os.tmpdir(), 'tmp.tmp.c');
            let command: string;
            const tempFileOut: string = npath.join(os.tmpdir(), 'tmp.tmp.out');
            let readFile: string;
            let configFileParameters = '';

            fs.writeFileSync(tempFile, textToFormat);

            if (textToFormat) {

                try {
                    
                    if (engine === 'go-qmk-keymap') {
                        if (parameters !== '') {
                            configFileParameters = ' -c ' + parameters; 
                        }
                        
                        let indentConfig = '';
                        if (indent > 0) {
                            indentConfig = ' -i ' + indent;
                        }
                        
                        command = "\"" + path + "\" " + configFileParameters + indentConfig + ' "$file" "$outfile" ';
                        command = command.replace('$file', tempFile);
                        command = command.replace('$outfile', tempFileOut);  
                        readFile = tempFileOut 
                    } else { // error, no formatting engine that we know
                        
                    }
                    
                    console.log(command);
                    cp.exec(command, function(error, stdout, stderr) {
                        console.log('stdout' + stdout);
                        console.log('error' + error);
                        console.log('stderr' + stderr);
                        if (error) {
                            reject(stdout.toString());
                        }
                        else {
                            const formattedXml: string = fs.readFileSync(readFile, 'utf8');
                            resolve(formattedXml);
                        }
                    });

                } catch (err) {
                    reject(err.toString());
                }

            }
            // the parser didn't return anything we can use, show an error message and return
            else {
                reject('no text to format');
            }
        });

    }

}