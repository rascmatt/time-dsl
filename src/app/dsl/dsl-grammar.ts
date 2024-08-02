import * as ohm from "ohm-js";

export const grammar = ohm.grammar(`
TimeExpression {

  Expression = Fragment+

  Fragment = ExactFragment    --exact
           | IntervalFragment --interval

  ExactFragment = ExactTime        --time
           \t\t| ExactDayOfWeek   --dayOfWeek
           \t\t| ExactDayOfMonth  --dayOfMonth
           \t\t| ExactMonth       --month
           \t\t| ExactYear        --year

  // Allow for pre- and post-fix units
  ExactTime = "at" (unit NumericValues | NumericValues unit)

  ExactDayOfWeek = "on" DayOfWeekValues
  ExactDayOfMonth = "on" ("days"|"day")? NumericValues

  ExactMonth = "in" MonthValues
  ExactYear = "in" NumericValues

  IntervalFragment = ("every" | "each") numericValue? unit ("starting" PropositionAndValue )?

  PropositionAndValue = "at" numericValue    -- time
                      | "on" dayOfWeekValue  -- dayOfWeek
                      | "on" "day"? numericValue\t -- dayOfMonth
                      | "in" numericValue\t -- year
                      | "in" monthValue \t -- month

  unit = longUnit
       | shortUnit

  longUnit = "seconds"
           | "second"
           | "minutes"
           | "minute"
           | "hours"
           | "hour"
           | "days"
           | "day"
           | "months"
           | "month"
           | "years"
           | "year"

  shortUnit = "s"
            | "m"
            | "h"
            | "d"
            | "y"


  NumericValues = numericValue (("," | "and") numericValue)*
  DayOfWeekValues = dayOfWeekValue+ (("," | "and") dayOfWeekValue)*
  MonthValues = monthValue+ (("," | "and") monthValue)*

  numericValue = digit+ ("st" | "nd" | "rd" | "th")?

  dayOfWeekValue = "monday"
           | "mon"
           | "tuesday"
           | "tue"
           | "wednesday"
           | "wed"
           | "thursday"
           | "thu"
           | "friday"
           | "fri"
           | "saturday"
           | "sat"
           | "sunday"
           | "sun"

  monthValue = "jan"
             | "feb"
             | "mar"
             | "apr"
             | "may"
             | "jun"
             | "jul"
             | "aug"
             | "sep"
             | "oct"
             | "nov"
             | "dec"
}
`);
