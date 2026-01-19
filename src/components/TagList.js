import React from 'react';

const TagList = ({ tags, variant = 'default' }) => {
  if (!tags || tags.length === 0) return null;

  const styles = {
    default: "text-[10px] font-medium px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full",
    minimal: "text-[10px] text-gray-200 group-hover:text-gray-400"
  };

  return (
    <div className="flex gap-2 mt-2">
      {tags.map(tag => (
        <span key={tag} className={styles[variant]}>
          #{tag}
        </span>
      ))}
    </div>
  );
};

export default TagList;
