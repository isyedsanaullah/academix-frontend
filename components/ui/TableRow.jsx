'use client';

import Checkbox from './Checkbox';

const TableRow = ({
  className = '',
  selectedRows,
  onRowSelect,
  children,
  onClick,
  ...rest
}) => {
  return (
    <tr
      className={`group relative [&_td]:relative [&_td]:z-2 [&_td]:border-t [&_td]:border-s-subtle transition-colors hover:bg-b-highlight/70 ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
      onClick={onClick}
      {...rest}
    >
      {onRowSelect && (
        <td
          className="w-10 max-lg:w-9 max-md:hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <Checkbox
            checked={Boolean(selectedRows)}
            onChange={onRowSelect}
          />
        </td>
      )}
      {children}
    </tr>
  );
};

export default TableRow;

