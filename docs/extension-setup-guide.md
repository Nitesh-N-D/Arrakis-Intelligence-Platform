# Extension Setup Guide

## Install

1. Open `chrome://extensions`
2. Enable Developer Mode
3. Click `Load unpacked`
4. Select the repository `extension/` directory

## Configure

1. Set backend API URL, for example `http://localhost:5000/api/v1`
2. Paste a valid Arrakis access token
3. Add blocked domains
4. Enable strict mode if you want hard blocking
5. Choose override minutes if strict mode is disabled
6. Save

## Validate

- open a blocked site
- confirm the Storm Zone page appears
- confirm override is hidden in strict mode
- confirm distraction logs appear in the Arrakis dashboard
