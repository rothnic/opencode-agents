
# Generalized Best Practices for Projects

## File Naming and Organization

- prefer file-type best practice conventions specific to frameworks if one exists
- markdown documents should be lowercase dash delimited names unless they are special case files (README, AGENTS, etc)
- prefer to move files into nested directories to organize them into collections that make sense and are easy to follow

## Coding Principles

- Use DRY KISS principles
- Before starting a task, we should consider how to know when it is complete and create a failing test before starting
- Use explicit verification as much as possible
- Before building something from scratch, consider if someone has already solved that problem and if we'd be better suited for our needs using pre-defined solutions

## Scripts and CLI Commands

- should leverage a cli framework of some kind to simplify parsing, especially when using types

## Markdown Files

- should use a consistent naming pattern
- should be organized into folders, rather than many docs being at the root of a directory
- should use markdown linting to enforce consistent formatting
- should have scripts to check other aspects, like consistent file naming, etc

## Enforcing Best Practices

- use hooks and scripts to efficiently identify anything that doesn't meet best practices if possible to automate
- leverage existing frameworks, linters, etc for anything possible, leveraging their configuration files
