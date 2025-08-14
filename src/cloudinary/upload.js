export async function uploadToCloudinary(file){
  const CLOUDINARY_CLOUD = 'tu_cloud';
  const CLOUDINARY_PRESET = 'unsigned_preset';
  const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`;
  const fd = new FormData();
  fd.append('upload_preset', CLOUDINARY_PRESET);
  fd.append('file', file);
  const res = await fetch(url, { method:'POST', body: fd });
  if(!res.ok) throw new Error('Cloudinary upload failed');
  return res.json(); // { secure_url, width, height, ... }
}
