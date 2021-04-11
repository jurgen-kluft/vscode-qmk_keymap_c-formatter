/*---------------------------------------------------------------------------------------------
*  Copyright (c) . All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { commands } from "vscode";
import { Container } from "../container";
import { WhatsNewManager } from "../../vscode-whats-new/src/Manager";
import { WhatsNewQMKKeymapFormatterContentProvider } from "./contentProvider";

export function registerWhatsNew() {
    const provider = new WhatsNewQMKKeymapFormatterContentProvider();
    const viewer = new WhatsNewManager(Container.context).registerContentProvider("qmk-keymap-formatter", provider);
    viewer.showPageInActivation();
    Container.context.subscriptions.push(commands.registerCommand('qmkKeymapFormatter.whatsNew', () => viewer.showPage()));
}


