# Arrakis Intelligence Platform API

Base URL: `http://localhost:5000/api/v1`

## POST `/auth/register`

```json
{
  "name": "Jessica",
  "email": "jessica@arrakis.ai",
  "password": "Arrakis@123",
  "targetRole": "AI Systems Engineer",
  "skills": [
    { "name": "React", "level": 4 },
    { "name": "Node.js", "level": 3 }
  ]
}
```

## POST `/auth/login`

```json
{
  "email": "paul@arrakis.ai",
  "password": "Arrakis@123"
}
```

## POST `/skills/analyze`

```json
{
  "targetRole": "AI Systems Engineer",
  "skills": [
    { "name": "React", "level": 4 },
    { "name": "Node.js", "level": 4 },
    { "name": "MongoDB", "level": 2 }
  ]
}
```

## POST `/spice/harvest`

```json
{
  "duration": 50,
  "type": "deep-50",
  "productivityScore": 88,
  "notes": "Architecture sprint"
}
```

## POST `/storm/log`

```json
{
  "appName": "YouTube",
  "duration": 45,
  "severity": "high",
  "metadata": {
    "device": "desktop",
    "category": "video"
  }
}
```

## GET `/prescience/analyze`

Returns burnout risk, trailing averages, and recommendations.
