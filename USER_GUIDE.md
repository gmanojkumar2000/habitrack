# Habitrack User Guide

Welcome to Habitrack! This guide outlines the complete functionality of the app, including the latest updates made to support Weekly Quests, Streak Rewards, Penalty Tracking, and the new Parent Dashboard.

## App Overview

Habitrack is a gamified habit-tracking application designed to help kids build positive routines through points, rewards, and streaks. It features two primary modes:
- **Child Mode:** A kid-friendly interface to check off daily tasks, complete weekly quests, view history, and work towards rewards.
- **Parent Mode:** A secure dashboard to manage tasks, review progress, administer penalties, and manage the reward economy.

---

## 1. The Child Experience

When a child logs in, they are greeted by an uplifting loading screen with a short motivational quote (now optimized to wait for just 5 seconds!). Once loaded, they have access to three main tabs:

### A. Today's Tasks (Daily Tracker)
- **Daily Habits:** A checklist of daily responsibilities (e.g., brushing teeth, doing homework). Checking them off instantly awards points.
- **This Week's Quests:** A new section below the daily tasks specifically for **Weekly Habits** (e.g., cleaning the room, folding laundry). These tasks only need to be completed once between Monday and Sunday to be marked as "Done" for the week.
- **Bonus Points ("I did something extra good!"):** Kids can log spontaneous good deeds (like helping with groceries) to earn extra points. Parents can later convert these into permanent daily habits if desired.

### B. Rewards
- **Ready to Claim:** Rewards that the child currently has enough points to afford.
- **Working Towards:** Aspiration rewards that require more points.
- **Streak Rewards:** A visual progress bar tracking consecutive days of completing all critical habits. Milestones (e.g., 3 days, 7 days, 14 days) offer special prestige or bonuses.
- **Redeeming:** When a child selects a reward, the app prompts them to ask their parent to officially redeem it in the Parent Mode.

### C. Dashboard
- **7-Day History:** A visual grid showing which habits were completed over the last week. This promotes consistency and lets kids see where they might be slacking.
- **Overall Stats:** Displays current level, total lifetime points, and the number of habits completed.

---

## 2. The Parent Experience

Parent Mode is protected by a PIN (default is `0000`) and serves as the command center for the app.

### A. Dashboard & Monitoring
- **Child Selector:** Switch between different children's profiles.
- **7-Day History:** Review a breakdown of which tasks were completed by the selected child over the last 7 days.
- **Recent Penalties (New!):** View any recently applied demerits. If a penalty was applied automatically by mistake, you can use the **Revert** button to instantly restore the lost points.

### B. Habit Management
- **Creating/Editing Habits:** You can create custom habits with a specific point value and category.
- **Frequency (New!):** You can now set a habit's frequency to either **Daily** or **Weekly**. Weekly habits appear in the "This Week's Quests" section for the child.
- **Critical Habits:** Mark essential habits as "Critical".

### C. Penalty System (Demerits)
Habitrack automatically enforces consistency for **Critical Habits**:
- **Daily Habits:** Missing a critical daily habit for 2 consecutive days issues a warning. Missing it for 3 days results in a 25-point deduction. Missing it for 5 days results in a 50-point deduction.
- **Weekly Habits (New!):** Missing a critical weekly quest for **2 consecutive weeks** automatically deducts 25 points, breaking the streak.

### D. Reward Management
- Create custom rewards (e.g., "Extra Screen Time", "New Toy") and assign a point cost and emoji icon.
- **Redeem Rewards:** Deduct points from the child's account when giving them a reward they've earned.

### E. Settings
- **Vacation Mode:** Pause the automatic penalty system while the family is on vacation.
- **User Management:** Update the child's profile name, avatar emoji, and theme color.
- **PIN Management:** Change the Parent PIN to ensure security.

---

## Technical Details (For the Administrator)
- **Database:** All data is now persistently stored in a local SQLite database (`data/habitrack.sqlite`), ensuring changes survive app restarts. The legacy browser-based sync feature has been completely removed.
- **Deployment:** The app is containerized using Docker and runs via `docker compose`. Updates are automatically reflected by rebuilding the `habitrack-web` container in your Homelab setup.
