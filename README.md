# Time Expression DSL Documentation

## Overview

This domain-specific language (DSL) is designed to parse time expressions similar to natural language and convert them into a cron expression. The DSL supports a variety of time expressions, including specific dates, days of the week, months, and times of day. The goal of this DSL is to provide a simple and intuitive way to define time-based schedules for tasks or events.

## Examples

Here are some examples of time expressions that can be parsed by the DSL:

- `every day at 9h at 30m` - Runs every day at 9:30 AM
- `every monday at 12h` - Runs every Monday at 12:00 PM
- `every 1st day at 8h` - Runs on the 1st of every month at 8:00 AM
