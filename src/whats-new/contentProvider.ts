/*---------------------------------------------------------------------------------------------
*  Copyright (c) . All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { ChangeLogItem, ChangeLogKind, Sponsor, ContentProvider, Header, Image, IssueKind } from "../../vscode-whats-new/src/ContentProvider";

export class WhatsNewQMKKeymapFormatterContentProvider implements ContentProvider {

    provideHeader(logoUrl: string): Header {
        return <Header>{logo: <Image> {src: logoUrl, height: 50, width: 50}, 
            message: `Make your <b>keymap.c</b> layouts look the way you want.`};
    }

    provideChangeLog(): ChangeLogItem[] {
        const changeLog: ChangeLogItem[] = [];

        changeLog.push({ kind: ChangeLogKind.VERSION, detail: { releaseNumber: "1.0.0", releaseDate: "April 2021" } });
        changeLog.push({
            kind: ChangeLogKind.NEW,
            detail: {
                message: "Formatter support",
                id: 23,
                kind: IssueKind.PR,
                kudos: ""
            }
        });
        
        return changeLog;
    }

    provideSponsors(): Sponsor[] {
        const sponsors: Sponsor[] = [];
        return sponsors;
    }
   
}