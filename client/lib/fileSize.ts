export const setFileSize = (size: number) => {
  let result: string;
  if (size >= Math.pow(1024, 3)) {
    result = (size / Math.pow(1024, 3)).toFixed(2);
    return `${result} GB`;
  } else if (size >= Math.pow(1024, 2)) {
    result = (size / Math.pow(1024, 2)).toFixed(2);
    return `${result} MB`;
  } else {
    result = (size / 1024).toFixed(2);
    return `${result} KB`;
  }
};
