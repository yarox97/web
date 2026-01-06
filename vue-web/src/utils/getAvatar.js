export { getAvatar }

const getAvatar = (name) => {
  const safeName = name || 'Unnamed'; 
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(safeName)}&background=0D8ABC&color=fff&size=128`;
};