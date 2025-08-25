export type Paging<T> = {
  from: number;
  count: number;
  total: number;
  items: T[];
};
