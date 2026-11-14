---
layout: page
title: Using /event
---

All times are entered in **UTC**. Everyone reading the announcement sees the
times converted to their own timezone.

## Commands

### `/event arms-race`

- **date**: pick from the list (today and the next 7 days), or type to filter,
  for example `mon`.
- **time**: pick a UTC time, or type to filter: `18` shows 18:00 and 18:30.
  You can also type an exact time like `18:15`. Times that already passed
  today are hidden.
- **part-b**:
  - *Immediately after Part A*: Part B starts when Part A ends.
  - *After reset*: Part B starts at 00:30 UTC the next day.
- **note** (optional): extra text shown in the announcement.

Creates one announcement and two scheduled events (Part A and Part B).

### `/event trade-route`

**date**, **time** and **note**, as above. Creates one announcement and one
scheduled event.

### `/event shadow-front`

- **squad**: Squad 1 or Squad 2.
- **slot**: 12:00, 18:00 or 23:00 UTC.
- **note** (optional).

Always schedules for the coming Friday. Run it on a Friday and it uses next
week's Friday. For both squads, run the command once per squad.

## Preview, then post

After you send the command you get a preview only you can see. It shows the
announcement exactly as it will be posted, plus the scheduled events it will
create with their UTC times.

- **Post** creates the scheduled events and posts the announcement in the
  event channel. The preview changes to *Posted ✅* with a link.
- **Cancel** discards it. Nothing is posted.

A preview whose start time has passed can't be posted anymore; run the
command again.

## Fixing a mistake

Delete the announcement message and the scheduled event(s) in Discord, then
run the command again.
