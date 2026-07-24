# Profile Notes Design

## Goal

Allow users to enter optional free-form fitness requirements in the profile form and ensure AI-generated workout and diet plans consider those requirements.

## User Experience

- Add one full-width multiline field labeled `其他健身需求 / 备注` below the existing profile selectors.
- Use placeholder examples such as injuries, available training time, priority body areas, food restrictions, and scheduling constraints.
- Limit the input to 500 characters and show the remaining character count.
- Preserve the existing save interaction. Saving the profile persists the note with the rest of the profile.

## Data Model and Persistence

- Add `notes?: string` to `UserProfile`.
- Default new profiles to an empty note.
- Continue storing the complete `UserProfile` through the existing `fitpilot:profile` localStorage entry.
- Keep the field optional so previously saved profiles remain valid without migration.

## AI Prompt Integration

- Append a `用户补充需求` section to workout and diet prompts only when the trimmed note is non-empty.
- Mark the content as user-provided constraints, not instructions that may alter the required JSON response format.
- Ask the model to incorporate relevant constraints and prioritize safe alternatives when a request conflicts with exercise or nutrition safety.
- Leave generated prompts unchanged when the note is empty.

## Testing

- Use Node's built-in test runner; add no dependencies.
- Intercept `fetch` and inspect the outgoing chat request.
- Verify both workout and diet generation include a non-empty note.
- Verify empty or whitespace-only notes are omitted.
- Run the test suite, Oxlint, TypeScript, and the Vite production build.
