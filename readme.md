# PROJECT TITLE

Smart Pomodoro Assistant with Drowsiness Detection Using Computer Vision and AI Productivity Analytics

# PROJECT OVERVIEW

Build a complete desktop application called "Smart Pomodoro Assistant" that helps students and workers improve productivity.

The application combines:

1. Pomodoro Timer
2. Task Management
3. Drowsiness Detection using Computer Vision
4. Focus Monitoring
5. Productivity Analytics
6. AI Productivity Coach
7. Telegram Notification Integration
8. Local Database Storage
9. Modern Desktop UI

The project must be suitable for a Final Project / Undergraduate Thesis.

The application must work completely offline except for optional Telegram notifications.

---

# MAIN OBJECTIVES

The system should:

* Help users maintain focus during study or work sessions.
* Detect drowsiness using webcam.
* Detect absence from workspace.
* Record productivity data.
* Generate productivity insights.
* Provide recommendations for improving focus.

---

# TARGET USERS

* Students
* University students
* Office workers
* Remote workers
* Content creators

---

# TECHNOLOGY STACK

Frontend Desktop:

* Electron
* React
* TypeScript
* Tailwind CSS
* Shadcn UI

Backend:

* Node.js
* Express.js

Computer Vision:

* Python
* OpenCV
* MediaPipe Face Mesh

Database:

* SQLite

ORM:

* Prisma

Notification:

* Telegram Bot API

Charts:

* Recharts

State Management:

* Zustand

Validation:

* Zod

Build Tool:

* Vite

---

# SYSTEM ARCHITECTURE

User
↓
React Desktop App
↓
Express API
↓
SQLite Database

Parallel:

Webcam
↓
Python OpenCV
↓
MediaPipe
↓
Focus Detection Engine
↓
Node API
↓
Database

---

# APPLICATION MODULES

MODULE 1

Authentication

Features:

* Register
* Login
* Logout
* Session management

Database tables:

users

Fields:

id
name
email
password_hash
created_at

---

MODULE 2

Task Management

Features:

* Create task
* Edit task
* Delete task
* Complete task
* Priority level

Task status:

* Pending
* In Progress
* Completed

Database:

tasks

Fields:

id
user_id
title
description
priority
status
created_at
completed_at

---

MODULE 3

Pomodoro Timer

Features:

* Start Session
* Pause
* Resume
* Stop
* Reset

Default:

25 minutes focus
5 minutes break

Custom Mode:

User can set:

* Focus duration
* Break duration
* Daily target

Database:

pomodoro_sessions

Fields:

id
user_id
start_time
end_time
focus_duration
break_duration
session_status

---

MODULE 4

Drowsiness Detection

Use:

Python
OpenCV
MediaPipe

Requirements:

Detect:

* Eye Aspect Ratio
* Blink frequency
* Eye closure duration

Rules:

IF eyes closed > 3 seconds

THEN:

* Show warning popup
* Play alert sound
* Save event
* Send Telegram notification

Database:

drowsiness_events

Fields:

id
user_id
event_time
eye_closure_duration
severity

Severity:

Low
Medium
High

---

MODULE 5

Focus Detection

Detect:

* Face not visible
* Looking away
* Leaving workstation

Rules:

Face missing > 60 seconds

THEN:

* Mark as distraction

Database:

focus_events

Fields:

id
user_id
event_type
start_time
end_time
duration

Event Types:

LOOKING_AWAY
FACE_MISSING
LEFT_DESK

---

MODULE 6

Productivity Dashboard

Display:

Today's focus hours
Weekly focus hours
Monthly focus hours

Display charts:

Focus trend
Task completion trend
Drowsiness trend
Distraction trend

Use Recharts.

---

MODULE 7

AI Productivity Coach

Build a recommendation engine.

Input:

Focus hours
Task completion
Drowsiness frequency
Distraction count

Generate:

Personalized productivity suggestions.

Example:

"You are most productive between 08:00 and 11:00."

"You frequently become drowsy after lunch."

"Consider taking a longer break every 90 minutes."

Implement rule-based AI first.

Design architecture so future LLM integration can be added.

---

MODULE 8

Telegram Notification

Integrate Telegram Bot.

Events:

Drowsiness detected
Session completed
Daily target achieved

Example message:

🚨 Drowsiness Detected

Eye closure duration:
4.2 seconds

Time:
14:32

Recommendation:
Take a short walk.

Store Telegram settings in database.

Database:

telegram_settings

Fields:

id
user_id
bot_token
chat_id
enabled

---

MODULE 9

Analytics

Calculate:

Focus Score

Formula:

Focus Score =
(Focus Minutes / Total Session Minutes) × 100

Productivity Score

Formula:

(Task Completed / Total Tasks) × 100

Drowsiness Score

Formula:

100 - Drowsiness Frequency Penalty

Store daily summaries.

Database:

daily_analytics

Fields:

id
user_id
date
focus_score
productivity_score
drowsiness_score

---

DATABASE DESIGN

users

tasks

pomodoro_sessions

drowsiness_events

focus_events

telegram_settings

daily_analytics

notifications

system_logs

Create complete Prisma schema.

---

API ENDPOINTS

Authentication:

POST /register
POST /login
POST /logout

Tasks:

GET /tasks
POST /tasks
PUT /tasks/:id
DELETE /tasks/:id

Pomodoro:

POST /pomodoro/start
POST /pomodoro/stop
GET /pomodoro/history

Computer Vision:

POST /vision/drowsiness
POST /vision/focus

Analytics:

GET /analytics/daily
GET /analytics/weekly
GET /analytics/monthly

Telegram:

POST /telegram/test

---

UI REQUIREMENTS

Create modern UI.

Pages:

Login Page

Dashboard

Task Management

Pomodoro Session

Analytics

Settings

Theme:

Dark Mode
Light Mode

Responsive Desktop Design

Modern productivity application style.

---

NON FUNCTIONAL REQUIREMENTS

Performance:

Detection latency < 1 second

Security:

Password hashing using bcrypt

Validation:

Zod validation

Logging:

Error logging
System logging

Code quality:

Clean Architecture
SOLID Principles
Repository Pattern

---

PROJECT STRUCTURE

frontend/

components
pages
hooks
services
store
types

backend/

controllers
services
repositories
routes
middlewares
utils

vision/

camera.py
eye_detector.py
focus_detector.py
mediapipe_service.py

database/

prisma
migrations

---

TESTING

Create:

Unit Tests

Integration Tests

API Tests

Computer Vision Tests

Use:

Vitest
Jest

---

DELIVERABLES

Generate:

1. Complete source code

2. Prisma schema

3. SQLite database setup

4. Folder structure

5. README.md

6. Installation guide

7. API documentation

8. ERD diagram

9. Sequence diagrams

10. Use Case diagram

11. Deployment guide

12. Sample screenshots/mockups

Generate code module by module and explain every implementation step.
