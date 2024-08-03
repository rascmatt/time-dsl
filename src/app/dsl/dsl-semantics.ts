import {ActionDict, Node} from "ohm-js";

export class ValidationError implements Error {
  message: string;
  name: string;

  constructor(message: string, source?: Node) {
    const lineMessage = source?.source?.getLineAndColumnMessage() || '';
    this.message = lineMessage + message;
    this.name = 'ValidationError';
  }
}

const mapUnit = (unit: string): 'second' | 'minute' | 'hour' | 'day' | 'month' | 'year' => {
  switch (unit) {
    case 'seconds':
    case 'second':
    case 's':
      return 'second';
    case 'minutes':
    case 'minute':
    case 'm':
      return 'minute';
    case 'hours':
    case 'hour':
    case 'h':
      return 'hour';
    case 'days':
    case 'day':
    case 'd':
      return 'day';
    case 'months':
    case 'month':
      return 'month';
    case 'years':
    case 'year':
    case 'y':
      return 'year';
  }
  throw new ValidationError('Invalid unit');
}
const mapDayOfWeek = (day: string): 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' => {
  switch (day) {
    case 'monday':
    case 'mon':
      return 'monday';
    case 'tuesday':
    case 'tue':
      return 'tuesday';
    case 'wednesday':
    case 'wed':
      return 'wednesday';
    case 'thursday':
    case 'thu':
      return 'thursday';
    case 'friday':
    case 'fri':
      return 'friday';
    case 'saturday':
    case 'sat':
      return 'saturday';
    case 'sunday':
    case 'sun':
      return 'sunday';
  }
  throw new ValidationError(`Invalid day of week '${day}'`);
}
const mapMonth = (month: string): 'january' | 'february' | 'march' | 'april' | 'may' | 'june' | 'july' | 'august' | 'september' | 'october' | 'november' | 'december' => {
  switch (month) {
    case 'jan':
      return 'january';
    case 'feb':
      return 'february';
    case 'mar':
      return 'march';
    case 'apr':
      return 'april';
    case 'may':
      return 'may';
    case 'jun':
      return 'june';
    case 'jul':
      return 'july';
    case 'aug':
      return 'august';
    case 'sep':
      return 'september';
    case 'oct':
      return 'october';
    case 'nov':
      return 'november';
    case 'dec':
      return 'december';
  }
  throw new ValidationError(`Invalid month '${month}'`);
}

export interface TimeUnit {
  unit: 'second' | 'minute' | 'hour' | 'day' | 'month' | 'year';
  type?: 'dayOfWeek' | 'dayOfMonth';
  values?: (number | string)[];
  interval?: {
    from: number;
    step: (number | string);
  };
}

/**
 * Visitor to transform the Ohm CST to an object representing a cron expression.
 */
export const semantics: ActionDict<any> = {

  Expression: function (fragments) {

    const resultFragments: any[] = fragments.children
      // Some fragments might return multiple values (e.g. exact time '03:25')
      .flatMap(f => {
        if (f['cron'] instanceof Array) {
          return f['cron'];
        }
        return [f['cron']];
      });

    // Validate no duplicate units (e.g. dayOfWeek and dayOfMonth are not allowed together)
    const units = resultFragments.map((f: TimeUnit) => f.unit);
    const duplicates = units.filter((u, i) => units.indexOf(u) !== i);
    if (duplicates.length) {
      throw new ValidationError(`Ambiguous specifications found for unit(s): [${duplicates.join(', ')}]`);
    }

    // Insert missing units
    [{unit: 'second'}, {unit: 'minute'}, {unit: 'hour'}, {unit: 'day', type: 'dayOfMonth'}, {unit: 'month'}, {unit: 'day', type: 'dayOfWeek'}, {unit: 'year'}]
      .filter(u => !resultFragments
        .some((f: TimeUnit) => f.unit === u.unit && (!u.type || f.type === u.type)))
      .map(u => {
        return {
          unit: u.unit,
          type: u.type
        }
      })
      .forEach(f => resultFragments.push(f));

    // Sort from most specific to the least specific
    const order = ['second', 'minute', 'hour', 'daydayOfMonth', 'month', 'daydayOfWeek', 'year'];
    resultFragments.sort((a: TimeUnit, b: TimeUnit) => {
      return order.indexOf(a.unit + (a.type || '')) - order.indexOf(b.unit + (b.type || ''));
    });

    return resultFragments;
  },
  Fragment_exact: function (exact) {
    return exact['cron'];
  },
  Fragment_interval: function (interval) {
    return interval['cron'];
  },
  ExactTime: function (_at, value): TimeUnit {
    return value['cron'];
  },
  ExactValue_unitAndTime: function (unit, values) {
    if (!(['second', 'minute', 'hour'].some(s => s === unit['cron']))) {
      throw new ValidationError(`Expected a time unit (seconds, minutes, hours).`, unit);
    }

    const invalid = values['cron'].filter((d: number) =>
      unit['cron'] === 'hour' ? d < 0 || d > 23 : d < 0 || d > 59);
    if (invalid?.length) {
      throw new ValidationError(`Invalid time value(s) ${invalid}`, values);
    }

    return {
      unit: unit['cron'],
      values: values['cron']
    } as TimeUnit;
  },
  ExactValue_timeAndUnit: function (values, unit) {
    if (!(['second', 'minute', 'hour'].some(s => s === unit['cron']))) {
      throw new ValidationError(`Expected a time unit (seconds, minutes, hours).`, unit);
    }

    const invalid = values['cron'].filter((d: number) =>
      unit['cron'] === 'hour' ? d < 0 || d > 23 : d < 0 || d > 59);
    if (invalid?.length) {
      throw new ValidationError(`Invalid time value(s) ${invalid}`, values);
    }

    return {
      unit: unit['cron'],
      values: values['cron']
    } as TimeUnit;
  },
  ExactValue_time: function (value) {
    return value['cron'];
  },
  ExactDayOfWeek: function (_on, values) {
    // No validation needed, the grammar ensures that the values are valid
    return {
      unit: 'day',
      type: 'dayOfWeek',
      values: values['cron']
    } as TimeUnit;
  },
  ExactDayOfMonth: function (_on, _days, values) {

    const invalid = values['cron'].filter((d: number) => d < 1 || d > 31);
    if (invalid?.length) {
      throw new ValidationError(`Invalid day(s) of month ${invalid}`, values);
    }

    return {
      unit: 'day',
      type: 'dayOfMonth',
      values: values['cron']
    } as TimeUnit;
  },
  ExactMonth: function (_in, values) {
    // No validation needed, the grammar ensures that the values are valid
    return {
      unit: 'month',
      values: values['cron']
    } as TimeUnit;
  },
  ExactYear: function (_in, values) {

    const invalid = values['cron'].filter((d: number) => d < 1970 || d > 2099);
    if (invalid?.length) {
      throw new ValidationError(`Invalid year(s) ${invalid}. Only years between 1970 and 2099 are supported.`,
        values);
    }

    return {
      unit: 'year',
      values: values['cron']
    } as TimeUnit;
  },
  IntervalFragment: function (_every, n0, unit, _starting, n1) {
    const interval = {
      from: 0,
      step: 1
    };

    interval.step = n0['cron']?.[0] || 1;
    interval.from = n1['cron']?.[0]?.value || 0;

    const u = unit['cron'];
    const start = n1['cron']?.[0];

    if ((u === 'second' || u === 'minute' || u === 'hour') && (start && start.type != 'time')) {
      throw new ValidationError(`Expected a time value for the starting point`, start);
    }

    if (u === 'day' && start && start.type != 'dom') {
      throw new ValidationError(`Expected a day of month for the starting point`, start);
    }

    if (u === 'month' && start && start.type != 'month') {
      throw new ValidationError(`Expected a month for the starting point`, start);
    }

    if (u === 'year' && start && start.type != 'year') {
      throw new ValidationError(`Expected a year for the starting point`, start);
    }

    return {
      unit: u,
      type: u === 'day' ? 'dayOfMonth' : undefined,
      interval
    } as TimeUnit;
  },
  PropositionAndValue_time: function (_at, n) {
    if (n['cron'] < 0 || n['cron'] > 59) {
      throw new ValidationError(`Invalid time value ${n['cron']}. Only values between 0 and 59 are supported.`, n);
    }
    return {
      type: 'time',
      value: n['cron']
    };
  },
  PropositionAndValue_dayOfWeek: function (_on, n) {
    return {
      type: 'dow',
      value: n['cron']
    };
  },
  PropositionAndValue_dayOfMonth: function (_on, _day, n) {
    if (n['cron'] < 1 || n['cron'] > 31) {
      throw new ValidationError(`Invalid day of month ${n['cron']}. Only values between 1 and 31 are supported.`, n);
    }
    return {
      type: 'dom',
      value: n['cron']
    };
  },
  PropositionAndValue_year: function (_in, n) {
    if (n['cron'] < 1970 || n['cron'] > 2099) {
      throw new ValidationError(`Invalid year ${n['cron']}. Only values between 1970 and 2099 are supported.`, n);
    }
    return {
      type: 'year',
      value: n['cron']
    };
  },
  PropositionAndValue_month: function (_in, n) {
    return {
      type: 'month',
      value: mapMonth(n['cron'])
    };
  },
  MonthValues: function (n0, _sep, n1) {
    return [...n0['cron'], ...n1['cron']].map(n => mapMonth(n));
  },
  DayOfWeekValues: function (n0, _sep, n1) {
    return [...n0['cron'], ...n1['cron']].map(n => mapDayOfWeek(n));
  },
  NumericValues: function (n0, _sep, n1) {
    return [n0['cron'], ...n1['cron']];
  },
  numericValue: function (n, _postfix) {
    return parseInt(n.sourceString, 10);
  },
  timeValue: function (hour, _colon, minute, _colon2, second) {
    const h = hour['cron'];
    const m = minute['cron'];
    let s = 0;
    if (second.sourceString) {
      s = second['cron']?.[0];
    }

    if (h < 0 || h > 23) {
      throw new ValidationError(`Invalid hour ${h}. Only values between 0 and 23 are supported.`, hour);
    }

    if (m < 0 || m > 59) {
      throw new ValidationError(`Invalid minute ${m}. Only values between 0 and 59 are supported.`, minute);
    }

    if (s < 0 || s > 59) {
      throw new ValidationError(`Invalid second ${s}. Only values between 0 and 59 are supported.`, second);
    }

    return [
      {
        unit: 'hour',
        values: [h]
      } as TimeUnit,
      {
        unit: 'minute',
        values: [m]
      },
      {
        unit: 'second',
        values: [s]
      }
    ]
  },
  doubleDigit: function (n0, n1) {
    return parseInt(n0.sourceString + n1.sourceString, 10);
  },
  unit: function (unit) {
    return mapUnit(unit.sourceString);
  },

  _iter(...children) {
    return children.map(c => c['cron']);
  },
  _terminal() {
    return this.sourceString;
  }
}
