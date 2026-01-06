export { formatDate }

const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-En', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};