import {AfterViewInit, Component, ElementRef, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import * as ace from "ace-builds";
import {Ace} from "ace-builds";
import Editor = Ace.Editor;

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrl: './editor.component.scss'
})
export class EditorComponent implements AfterViewInit {

  @ViewChild("editor") private editorRef: ElementRef<HTMLElement> = {} as ElementRef<HTMLElement>;

  @Input() title: string = 'Editor';
  @Input() mode: string = 'ace/mode/json';

  @Output() valueChange = new EventEmitter<string>();
  private _value: string = '';

  editor: Ace.Editor = {} as Editor;

  get value(): string {
    return this._value;
  }

  @Input()
  set value(value: string) {
    this._value = value;
    if (this.editor?.setValue) {
      this.editor.setValue(value);
      this.editor.clearSelection();
    }
  }

  ngAfterViewInit(): void {
    ace.config.set('basePath', 'https://unpkg.com/ace-builds@1.4.12/src-noconflict');

    /* Mode */
    const oop = ace.require("ace/lib/oop");
    const TextMode = ace.require("ace/mode/text").Mode;
    const TextHighlightRules = ace.require("ace/mode/text_highlight_rules").TextHighlightRules;
    const CstyleBehaviour = ace.require('ace/mode/behaviour/cstyle').CstyleBehaviour;

    const HighlightRules = function () {
      // @ts-ignore
      this.$rules = {
        "start": [
          {
            token: "keyword",
            regex: "\\b(?:on|at|in|every|each|starting|seconds|second|s|minutes|minute|m|hours|hour|h|days|day|d|months|month|years|year|y|monday|mon|tuesday|tue|wednesday|wed|thursday|thu|friday|fri|saturday|sat|sunday|sun)\\b"
          },
          {
            token: "constant.numeric",
            regex: "\\b\\d+\\b"
          },
          {
            token: "identifier",
            regex: "[a-zA-Z_][a-zA-Z0-9_]*"
          },
          {
            token: "text",
            regex: "\\s+"
          }
        ]
      };
    };
    oop.inherits(HighlightRules, TextHighlightRules);


    const Mode = function () {
      // @ts-ignore
      this.HighlightRules = HighlightRules;
      // @ts-ignore
      this.$behaviour = new CstyleBehaviour();
    };
    oop.inherits(Mode, TextMode);

    /* End */

    this.editor = ace.edit(this.editorRef.nativeElement);
    this.editor.setTheme("ace/theme/textmate");

    // @ts-ignore
    this.editor.session.setMode(this.mode === 'ace/mode/mydsl' ? new Mode : this.mode);
    this.editor.setOptions({
      fontSize: "14px",
      showPrintMargin: false,
      showLineNumbers: true,
      tabSize: 2
    });

    this.editor.setValue(this._value);
    this.editor.clearSelection();
    this.editor.focus();

    this.editor.on('change', () => {
      this._value = this.editor.getValue();
      this.valueChange.emit(this._value);
    });
  }

}
