PRODUCT IDEA – BASIC KIDS HABIT AND MANNERS TRACKER

Core purpose:
Build a simple app for kids and parents to track daily habits, manners, and extra positive actions using points, streaks, and progress tracking.

Primary goal:
Start small with a clear daily loop instead of building a large game system too early.

Core daily loop:
1. Select child profile from a profile picker screen like Netflix
2. Open daily tracker
3. View assigned habits/manners for the day
4. Mark completed items
5. Add ad hoc positive actions or bonus items
6. Optionally convert ad hoc item into a recurring daily habit
7. View updated daily points and streaks
8. Check progress and leaderboard screens

TARGET USERS
- Parent manages setup and tracks progress
- Child uses the daily screen to complete habits and view progress

CORE FEATURES

1. Profile Selection Screen
- Large profile cards like Netflix
- Child avatar, name, and color theme
- Add new user button
- Parent mode entry

2. First-Time Setup
- Add child name
- Pick avatar
- Select starter habits/manners
- Assign initial point values

3. Daily Tracker Screen
- Show today’s habits
- Mark habits complete with checkbox/tap
- Show point values
- Show running daily total
- Quick add for ad hoc items and bonuses

4. Ad Hoc Item Flow
- Add a one-time positive action or extra task
- Fields: title, points, category, optional note
- Checkbox: “Make this a daily habit”
- If checked, save as recurring habit for future days

5. Progress Screen
- Daily, weekly, monthly points
- Completion rate
- Streaks
- Charts / progress bars
- Best habits and best days

6. Leaderboard Screen
- Compare users by weekly points, streaks, and badges
- Keep language positive and encouraging

7. Parent Mode
- Add/edit users
- Add/edit habits
- Assign point values
- Add bonus points
- Review history
- Manage recurring habits

STARTER HABIT CATEGORIES

Manners
- Respect elders
- Use kind words
- Listen properly
- Say please and thank you

Responsibility
- Finish homework
- Keep books/toys in place
- Get ready on time
- Help parents

Health
- Drink water
- Brush teeth
- Sleep on time

Bonus / Extra Good Actions
- Helped sibling
- Shared nicely
- Did extra reading
- Completed an extra task

MVP DATA ENTITIES

User
- id
- name
- avatar
- colorTheme
- createdAt

HabitTemplate
- id
- userId
- title
- category
- points
- isActive
- createdAt

DailyHabitEntry
- id
- userId
- date
- habitTemplateId
- titleSnapshot
- pointsSnapshot
- completed
- completedAt

AdHocEntry
- id
- userId
- date
- title
- points
- category
- note
- convertToHabit
- createdAt

DailyBonus
- id
- userId
- date
- title
- points

Notes
- id
- userId
- date
- text

APP NAVIGATION
- Profiles
- Today
- Progress
- Leaderboard
- Parent

DESIGN DIRECTION
- Bright, clean, modern, kid-friendly
- Rounded cards
- Large touch targets
- Avatar-based profile selection
- Progress bars, badges, and subtle animations
- Minimal but visually appealing

V1 GOAL
Validate the core loop:
- Can a parent set habits quickly?
- Can a child check them off daily?
- Can ad hoc good actions be added easily?
- Can progress be seen clearly?
- Can multiple users be compared positively?

DO NOT ADD IN V1
- Complex racing game mechanics
- Tracks, rivals, garages
- Deep story engine
- Too many gamification layers

V2 IDEAS
- Badges
- Levels
- Streak rewards
- Better animations
- Parent approvals

V3 IDEAS
- Add the car-based theme as a progression layer on top of the validated tracker