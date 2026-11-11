---
name: github-issue-images
description: Put screenshots and images into GitHub issues, issue comments and PR comments from the terminal, where `gh` can't upload attachments. Uploads them to a hidden git ref in the repo (not a branch) and embeds commit-pinned links that render in private repos. Use whenever you create or comment on an issue and the user attached or pointed at images (T3 Code attachments, screenshots, mockups, reference designs), or when asked to "add the screenshot to the issue".
---

# Images in GitHub issues

GitHub has no API for the `user-attachments` uploads the web editor makes, and `gh` can't do it either. Instead, commit the image to `refs/assets/issue-images` in the same repo and embed a link pinned to that commit. That ref is outside `refs/heads`, so it isn't a branch: no "recent pushes" banner, nothing in the branch list or clones, no CI or deploys, and nothing on `main`. It still keeps the commits alive, the link renders for anyone with repo access (private repos included), and agents can fetch the actual file.

Don't put images on a branch or commit them to `main` (in product repos that deploys).

Never upload to public hosts (imgur, 0x0.st, gists, public R2). Screenshots of private projects stay in the private repo.

## 1. Find the images

- T3 Code saves chat attachments under `~/.t3/userdata/attachments/`. The message shows each saved path (`Attached image "…" is saved at: …`); use those exact paths.
- Look at every image first. Upload only ones that belong in the issue, and know what each shows so you can caption it.

## 2. Upload

```bash
UP=~/.agents/skills/github-issue-images/scripts/upload.sh
$UP -R owner/repo -d issue-76 -c "Reference: pill count badges" /path/to/ref.png
# prints: <img width="504" alt="Reference: pill count badges" src="https://github.com/owner/repo/blob/<sha>/issue-76/ref.png?raw=true" />
```

- Creating a new issue: upload first (the default folder is a dated random slug), then put the tags in the `gh issue create` body.
- Commenting on an existing issue: use `-d issue-<n>` (or `pr-<n>`).
- One `-c` caption applies to every file in the call. Upload separately when captions differ.
- The first upload to a repo creates the ref. Never delete it: every embedded image points at its commits.

## 3. Embed with context

Put images in the **issue body** (some agents read only the body), next to the text they illustrate, each with a line saying what it is and how to use it:

```markdown
**Reference style (match shape, size and alignment; colours are just examples):**
<img … />

**Current bug (the count sits below the label's centre):**
<img … />
```

Say plainly whether an image is the target design, the current broken state, or just context. To add images to an issue that's already open, edit the body (`gh issue view N --json body -q .body > body.md`, insert, `gh issue edit N --body-file body.md`) without dropping existing text, or post a comment if the user asked for one.

## For agents working on the issue

The `?raw=true` links need repo access. Take the commit SHA and path from the link (`…/blob/<sha>/<path>?raw=true`). Without a checkout: `gh api "repos/owner/repo/contents/<path>?ref=<sha>" -H "Accept: application/vnd.github.raw" > ref.png`. With one: `git fetch origin refs/assets/issue-images && git show FETCH_HEAD:<path> > ref.png`. Then look at the file.
