# Terraform 004 Practice Lab

A polished, zero-dependency practice site for **HashiCorp Certified: Terraform Associate (004)**.

**Once GitHub Pages is enabled:** https://rgardiner2002.github.io/terraform-004-quiz/

## What's included

- **80 original practice questions** — 10 in each of the eight official exam objective areas.
- **60-minute full mock exam** with 60 randomly selected questions and a question navigator.
- **Quick practice (10 questions)** and **deep dive (25 questions)** modes.
- **Focused practice by objective**, with single-select, multi-select and true/false formats.
- **Explanations** after checking practice answers and a complete review at the end of each exam.
- **Accuracy and coverage tracking**, including domain-by-domain performance.
- **Bookmarks**, question search, difficulty filters and targeted retry of missed questions.
- **Automatic local progress saving** and the ability to return to an unfinished session.
- **Responsive dark/light theme**, keyboard shortcuts, no account or database required.

All progress is stored in your own browser using localStorage. It does **not** synchronise between devices.

## Publish on GitHub Pages

1. Open **Settings → Pages** in this repository.
2. Under **Build and deployment**, select **Deploy from a branch**.
3. Choose branch **main** and folder **/(root)**, then **Save**.
4. When the deployment has completed, open **https://rgardiner2002.github.io/terraform-004-quiz/**.

> **Important:** This repository started as **private**. GitHub Free supports Pages for public repositories; GitHub Pro and qualifying organisation plans support Pages for private repositories. If you have GitHub Free, make the repository public **only if you want the source code public**, then enable Pages. Published Pages sites are normally publicly accessible even if their source repository is private.

## Run locally

No build step or npm dependencies are needed. From the repository root:

```bash
python -m http.server 8000
```

Open http://localhost:8000 in your browser. You can also open `index.html` directly in many browsers.

## Project structure

| File | Purpose |
| --- | --- |
| `index.html` | Site layout and metadata |
| `styles.css` | Responsive design and dark/light theme |
| `app.js` | Quiz engine, timer, review, search and browser progress |
| `questions.js` | Original, answer-keyed practice questions |
| `favicon.svg` | Custom site icon |
| `.nojekyll` | Serve the static assets directly through GitHub Pages |

## Exam coverage

The question bank follows [HashiCorp's Terraform Associate 004 objectives](https://developer.hashicorp.com/terraform/tutorials/certification-004/associate-review-004), which test **Terraform 1.12**.

1. Infrastructure as Code with Terraform
2. Terraform fundamentals
3. Core Terraform workflow
4. Terraform configuration
5. Terraform modules
6. Terraform state management
7. Maintain infrastructure with Terraform
8. HCP Terraform

Newer 004 areas, including `depends_on` / `create_before_destroy`, custom conditions, ephemeral values, and HCP workspace/project organisation, are included.

**Independent study resource:** This project is not affiliated with or endorsed by HashiCorp. All practice questions are original and are **not** official or leaked certification exam questions. Practice scores are not a prediction of an official pass result.

## Keyboard shortcuts

During a quiz, press **1–4** to select an answer, **←/→** to navigate, and **Enter** to check or move forward.
