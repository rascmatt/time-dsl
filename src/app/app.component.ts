import {Component} from '@angular/core';
import {ClarityIcons, detailsIcon} from "@cds/core/icon";
import {Semantics} from "ohm-js";
import {grammar} from "./dsl/dsl-grammar";
import {semantics, TimeUnit} from "./dsl/dsl-semantics";

ClarityIcons.addIcons(detailsIcon);

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  title = 'Time Expression DSL';
  transform!: Semantics;

  translated = '';

  constructor() {
    // Create the semantics
    this.transform = grammar.createSemantics().addAttribute('cron', semantics);
  }

  onInputChanged(value: string) {
    const m = grammar.match(value);
    if (m.succeeded()) {
      try {
        const result = this.transform(m)['cron'];

        const cron = result
          .filter((u: TimeUnit) => u.unit !== 'second' && u.unit !== 'year')
          .map((u: TimeUnit) => this.mapToCronFragment(u))
          .join(' ');

        this.translated = cron;
        /*console.log(cron);
        this.translated = JSON.stringify(result, null, 2);*/
      } catch (e: any) {
        console.error(e?.message);
      }
    } else {
      console.error(m.message || 'Syntax error');
    }
  }

  mapToCronFragment(unit: TimeUnit): string {

    if (unit.unit === 'month') {
      if (unit.values?.length) {
        unit.values = unit.values.map((m: any) => this.mapMonthToCron(m));
      }
      if (unit.interval?.from) {
        unit.interval.from = this.mapMonthToCron(unit.interval.from as any);
      }
    } else if (unit.unit === 'day' && unit.type === 'dayOfWeek') {
      if (unit.values?.length) {
        unit.values = unit.values.map((m: any) => this.mapWeekdayToCron(m));
      }
    } else {
      if (unit.values?.length) {
        unit.values = unit.values.map((v: any) => v - 1); // 0-based
      }
    }

    if (unit.interval) {
      if (unit.interval.step === 1 && unit.interval.from === 0) {
        return '*';
      }
      if (unit.interval.step === 1) {
        return `*/${unit.interval.from}`;
      }
      return `${unit.interval.step}/${unit.interval.from}`;
    }

    if (unit.values?.length) {
      return unit.values.join(',');
    }

    if (unit.type === 'dayOfWeek') {
      return '?';
    }
    if (unit.type === 'dayOfMonth') {
      return '*';
    }
    if (unit.unit === 'year') {
      return '*';
    }
    if (unit.unit === 'month') {
      return '*';
    }

    // Time units (hours, minutes, seconds) default to 0, if not specified.
    return '0';
  }

  mapMonthToCron(month: string): number {
    switch (month.toLowerCase()) {
      case 'january':
        return 1;
      case 'february':
        return 2;
      case 'march':
        return 3;
      case 'april':
        return 4;
      case 'may':
        return 5;
      case 'june':
        return 6;
      case 'july':
        return 7;
      case 'august':
        return 8;
      case 'september':
        return 9;
      case 'october':
        return 10;
      case 'november':
        return 11;
      case 'december':
        return 12;
      default:
        throw new Error(`Invalid month: ${month}`);
    }
  }

  mapWeekdayToCron(weekday: string): number {
    switch (weekday.toLowerCase()) {
      case 'sunday':
        return 0;
      case 'monday':
        return 1;
      case 'tuesday':
        return 2;
      case 'wednesday':
        return 3;
      case 'thursday':
        return 4;
      case 'friday':
        return 5;
      case 'saturday':
        return 6;
      default:
        throw new Error(`Invalid weekday: ${weekday}`);
    }
  }
}
