import { ClientResponseError } from 'pocketbase';

/**
 * Update a school
 * PATCH /api/schools/:id
 *
 * Owner only. Expects multipart/form-data with any of:
 * - name: string
 * - description: string
 * - topics: repeated relation ids (a single empty value clears them)
 * - logo / banner: image files
 * - remove: "logo" or "banner" (repeatable) to clear an existing image
 */

const IMAGE_FIELDS = ['logo', 'banner'] as const;
const MAX_IMAGE_SIZE: Record<string, number> = { logo: 5 * 1024 * 1024, banner: 10 * 1024 * 1024 };

type ImageField = (typeof IMAGE_FIELDS)[number];
const isImageField = (name: string): name is ImageField => IMAGE_FIELDS.includes(name as ImageField);

export default defineEventHandler(async (event) => {
  const pb = await createPocketBaseInstance(event);
  const user = requireAuthUser(event, pb);
  const school = await loadSchool(pb, getRouterParam(event, 'id'));
  assertSchoolOwner(school, user);

  const parts = await readMultipartFormData(event);
  if (!parts || parts.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'No data provided.' });
  }

  const formData = new FormData();
  const uploadedImages = new Set<ImageField>();
  const removedImages = new Set<ImageField>();
  let topics: string[] | null = null;

  for (const part of parts) {
    const value = part.data.toString('utf-8');

    if (part.name === 'name') {
      const name = value.trim();
      if (name.length < 2 || name.length > 80) {
        throw createError({ statusCode: 400, statusMessage: 'The school name must be between 2 and 80 characters.' });
      }
      formData.append('name', name);
    } else if (part.name === 'description') {
      formData.append('description', value.trim());
    } else if (part.name === 'topics') {
      // The client always sends this field when topics are editable; an empty value clears them.
      topics = topics ?? [];
      if (value) topics.push(value);
    } else if (part.name && isImageField(part.name) && part.filename) {
      if (!part.type?.startsWith('image/')) {
        throw createError({ statusCode: 400, statusMessage: `The ${part.name} must be an image.` });
      }
      if (part.data.length > MAX_IMAGE_SIZE[part.name]!) {
        throw createError({
          statusCode: 400,
          statusMessage: `The ${part.name} must be smaller than ${MAX_IMAGE_SIZE[part.name]! / (1024 * 1024)}MB.`,
        });
      }
      formData.append(part.name, new Blob([new Uint8Array(part.data)], { type: part.type }), part.filename);
      uploadedImages.add(part.name);
    } else if (part.name === 'remove' && isImageField(value)) {
      removedImages.add(value);
    }
  }

  // An empty value tells PocketBase to drop the stored file. A replacement upload wins over a removal.
  for (const field of removedImages) {
    if (!uploadedImages.has(field)) formData.append(field, '');
  }

  if (topics !== null) {
    if (topics.length === 0) {
      formData.append('topics', '');
    } else {
      topics.forEach(topic => formData.append('topics', topic));
    }
  }

  try {
    return await pb.collection('schools').update(school.id, formData, { expand: 'owner,topics' });
  } catch (error) {
    if (error instanceof ClientResponseError && error.status === 400) {
      throw createError({ statusCode: 400, statusMessage: error.response?.message || 'Failed to update the school.' });
    }
    console.error(`Failed to update school ${school.id}:`, error);
    throw createError({ statusCode: 500, statusMessage: 'Failed to update the school.' });
  }
});
