# Quick Support Guide (EN)

This guide is focused on support operations: what to change, where to change it, and in which order.

## Where to make changes

- `config/zip-modules.js`: optional and required module configuration.
- `public/modules/`: JavaScript module files (local fallback source).
- `pages/index.js`: ZIP conversion and HTML injection logic.

## How to update an existing module

1. Replace the module file in `public/modules/`.
2. Open `config/zip-modules.js` and check that module entry.
3. Ensure `name` matches the exact filename.
4. Keep `urls` in this order:
   - `/modules/file-name.js`
   - GitHub raw URL for `main`
   - GitHub raw URL for `master`

## How to update a module path

If you rename a file or move it:

1. Update the physical file in `public/modules/`.
2. Update `name` and `urls` in `config/zip-modules.js`.
3. Confirm local path `/modules/...` opens correctly in browser.

## How to add a new optional module

1. Add the file into `public/modules/`.
2. Add a new item in `ZIP_MODULES` inside `config/zip-modules.js` with:
   - unique `id`
   - `name` equal to filename
   - `label` shown in UI
   - `defaultChecked` (`true` or `false`)
   - `urls` using local + GitHub fallback
3. Save and test ZIP conversion with that module selected.

## Always-included modules

Required modules are listed in `AUTO_INCLUDE_MODULES` in `config/zip-modules.js`.

When updating them, use the same path/fallback rule as optional modules.

## alarms module: required images

When `alarms.js` is selected, the converter also adds these images automatically to the output ZIP:

- `img/active.webp`
- `img/inactive.webp`
- `img/resettable.webp`

Image source files in the project:

- `public/images/active.webp`
- `public/images/inactive.webp`
- `public/images/resettable.webp`

## How to update alarms images in the future

1. Replace files in `public/images/` keeping the same filenames.
2. If filename or extension changes, update asset mapping in `pages/index.js` (`OPTIONAL_MODULE_ASSETS`, `alarms` entry).
3. If you move away from `.webp`, also validate status filename detection in `public/modules/alarms.js`.
4. Test conversion with `alarms` selected and confirm all 3 images are present in `img/` inside the final ZIP.

## Quick support checklist

1. File exists in `public/modules/`.
2. `name` matches the real filename.
3. `urls` are correct and ordered local -> main -> master.
4. If `alarms` is selected, confirm `active.webp`, `inactive.webp`, `resettable.webp` exist in `img/` in the final ZIP.
5. ZIP conversion runs without `Error fetching ...`.
