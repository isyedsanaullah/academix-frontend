'use client';

import Checkbox from './Checkbox';

const Table = ({
  selectAll,
  onSelectAll,
  cellsThead,
  children,
  isMobileVisibleTHead = true,
  className = '',
}) => {
  return (
    <div className="w-full overflow-x-auto">
      <table
        className={`w-full text-body-2 border-collapse [&_th]:h-14 [&_th,&_td]:pl-5 [&_th,&_td]:py-3.5 [&_th,&_td]:first:pl-4 [&_th,&_td]:last:pr-4 [&_th]:align-middle [&_th]:text-left [&_th]:text-caption [&_th]:text-t-tertiary [&_th]:font-semibold [&_th]:uppercase [&_th]:tracking-wider max-lg:[&_th,&_td]:first:pl-3 max-md:[&_th,&_td]:p-3 max-md:[&_th]:h-12 ${className}`}
      >
        <thead className={isMobileVisibleTHead ? '' : 'max-md:hidden'}>
          <tr className="border-b border-s-subtle">
            {onSelectAll && (
              <th className="w-10 max-md:hidden">
                <Checkbox
                  checked={Boolean(selectAll)}
                  onChange={(value) => onSelectAll(value)}
                />
              </th>
            )}
            {cellsThead}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
};

export default Table;

