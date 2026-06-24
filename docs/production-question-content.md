# Production Question Content

Stage 33 adds a production seed path for Supabase `question_bank_items`.
Question content should use the same JSON envelope accepted by the Stage 32
admin import tool.

## Seed Location

```txt
supabase/seed/question_bank_items.json
```

This file is not imported automatically during `npm run build`. It is a manual
seed source for reviewed environments.

## JSON Shape

```json
{
  "format": "topopass-question-bank-items",
  "version": 1,
  "exportedAt": "2026-06-24T00:00:00.000Z",
  "statusFilter": "all",
  "question_bank_items": [
    {
      "id": "question-id",
      "question_type": "knowledge",
      "status": "draft",
      "difficulty": "easy",
      "category": "Map reading",
      "prompt": "Question prompt?",
      "explanation": "Explanation shown after answer review.",
      "tip": "Short learner tip.",
      "tags": ["Map reading"],
      "payload": {},
      "version": 1,
      "source": "production-seed"
    }
  ]
}
```

The importer also accepts a raw array of `question_bank_items` records, but the
envelope is preferred for production review.

## Required Fields

- `id`: stable unique text identifier.
- `question_type`: `knowledge`, `map-click`, or `route-drawing`.
- `status`: `draft`, `published`, or `archived`; omit only when you want the
  importer to default to `draft`.
- `prompt`: learner-facing question prompt.
- `payload`: type-specific question data.
- `version`: positive integer; defaults to `1` if omitted.
- `source`: short source label; defaults to `admin-import` if omitted.

Knowledge payloads require:

- `options`: at least two answer options.
- `correctAnswer`: one of the options.
- `incorrectExplanations`: optional map of option to feedback.

Map-click payloads require:

- `targetName`: learner-readable target name.
- `answer`: `{ "lat": number, "lng": number }`.
- `toleranceMeters`: positive number.
- `acceptedAreaDescription`: optional review text.

Route-drawing payloads require:

- `title`
- `fromLabel`
- `toLabel`
- `from`: `{ "lat": number, "lng": number }`
- `to`: `{ "lat": number, "lng": number }`
- `mapArea`
- `mapBounds`: numeric `minX`, `minY`, `maxX`, `maxY`
- `acceptedRoute`: optional, but recommended before publishing route content.

## Review And Publishing

New production content should normally start as `draft`. Draft records are
visible to admins but hidden from learner-facing database reads. Review seeded
questions in `/admin/questions`, then publish only records that have been
checked for wording, answer correctness, map coordinates, and route geometry.

Published records are eligible for learner-safe Supabase reads. Archived records
remain hidden from learners and available for admin review.

## Manual Import

Use the admin UI:

```txt
/admin/questions/import-export
```

Or run the explicit seed command:

```powershell
npm.cmd run seed:questions
```

The seed command validates with the same Stage 32 import helper before writing.
It uses Supabase anon credentials plus a normal admin login, so Row Level
Security remains active. It refuses to run if required environment variables are
missing.
