import React, {
  useCallback,
  useState,
  createContext,
  useContext,
  useMemo,
  ReactNode,
} from 'react';
// @ts-ignore not configured to import json
import githubData from './row_auto_height_data.json';

import { formatDate } from '../../../../src/services';

import {
  EuiDataGrid,
  EuiDataGridProps,
} from '../../../../src/components/datagrid';
import { EuiLink } from '../../../../src/components/link';
import { EuiAvatar } from '../../../../src/components/avatar';
import { EuiBadge } from '../../../../src/components/badge';
import { EuiMarkdownFormat } from '../../../../src/components/markdown_editor';
import { EuiText } from '../../../../src/components/text';
import { EuiSpacer } from '../../../../src/components/spacer';

interface DataShape {
  html_url: string;
  title: string;
  user: {
    login: string;
    avatar_url: string;
  };
  labels: Array<{
    name: string;
    color: string;
  }>;
  comments: number;
  created_at: string;
  body?: string;
}

// convert strings to Date objects
for (let i = 0; i < githubData.length; i++) {
  githubData[i].created_at = new Date(githubData[i].created_at);
}

type DataContextShape =
  | undefined
  | {
      data: DataShape[];
    };
const DataContext = createContext<DataContextShape>(undefined);

const columns = [
  {
    id: 'index',
    displayAsText: 'Index',
    isExpandable: false,
    initialWidth: 80,
  },
  {
    id: 'issue',
    displayAsText: 'Issue',
    isExpandable: false,
  },
  {
    id: 'body',
    displayAsText: 'Description',
  },
];

// it is expensive to compute 10000 rows of fake data
// instead of loading up front, generate entries on the fly
const raw_data: DataShape[] = githubData;

const RenderCellValue: EuiDataGridProps['renderCellValue'] = ({
  rowIndex,
  columnId,
  isDetails,
}) => {
  const { data } = useContext(DataContext)!;

  const item = data[rowIndex];
  let content: ReactNode = '';

  if (columnId === 'index') {
    content = <>{rowIndex}</>;
  } else if (columnId === 'issue') {
    content = (
      <>
        <EuiText size="relative">
          <h3>
            <EuiLink color="text" href={item.html_url} target="blank" external>
              {item.title}
            </EuiLink>
            {'  '}
            {item.labels.map(({ name, color }) => (
              <EuiBadge key={name} color={`#${color}`}>
                {name}
              </EuiBadge>
            ))}
          </h3>
        </EuiText>

        <EuiSpacer size="s" />

        <EuiText color="subdued" size="relative">
          <span>
            Opened by{' '}
            <EuiAvatar
              name={item.user.login}
              imageUrl={item.user.avatar_url}
              size="s"
            />{' '}
            {item.user.login} on {formatDate(item.created_at, 'dobLong')}
          </span>
        </EuiText>

        <EuiSpacer size="s" />

        {item.comments === 1 && (
          <EuiBadge iconType="editorComment" iconSide="left" color="hollow">
            {`${item.comments} comment`}
          </EuiBadge>
        )}

        {item.comments >= 2 && (
          <EuiBadge iconType="editorComment" iconSide="left" color="hollow">
            {`${item.comments} comments`}
          </EuiBadge>
        )}
      </>
    );
  } else if (columnId === 'body') {
    if (isDetails) {
      // expanded in a popover
      content = <EuiMarkdownFormat>{item.body ?? ''}</EuiMarkdownFormat>;
    } else {
      // a full issue description is a *lot* to shove into a cell
      content = (
        <EuiMarkdownFormat textSize="relative">
          {(item.body ?? '').slice(0, 300)}
        </EuiMarkdownFormat>
      );
    }
  }

  return content;
};

export default () => {
  // Pagination
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 50 });

  // Sorting
  const [sortingColumns, setSortingColumns] = useState([]);
  const onSort = useCallback(
    (sortingColumns) => {
      setSortingColumns(sortingColumns);
    },
    [setSortingColumns]
  );

  const onChangeItemsPerPage = useCallback(
    (pageSize) =>
      setPagination((pagination) => ({
        ...pagination,
        pageSize,
        pageIndex: 0,
      })),
    [setPagination]
  );

  const onChangePage = useCallback(
    (pageIndex) =>
      setPagination((pagination) => ({ ...pagination, pageIndex })),
    [setPagination]
  );

  // Column visibility
  const [visibleColumns, setVisibleColumns] = useState(
    columns.map(({ id }) => id)
  );

  // matches the snippet example
  const rowHeightsOptions = useMemo(
    () => ({
      defaultHeight: 140,
      rowHeights: {
        1: {
          lineCount: 5,
        },
        4: 200,
        5: 80,
      },
    }),
    []
  );

  const dataContext = useMemo<DataContextShape>(
    () => ({
      data: raw_data,
    }),
    []
  );

  return (
    <DataContext.Provider value={dataContext}>
      <EuiDataGrid
        aria-label="Row height options with auto demo"
        columns={columns}
        columnVisibility={{ visibleColumns, setVisibleColumns }}
        rowCount={raw_data.length}
        height={400}
        renderCellValue={RenderCellValue}
        inMemory={{ level: 'sorting' }}
        sorting={{ columns: sortingColumns, onSort }}
        rowHeightsOptions={rowHeightsOptions}
        virtualizationOptions={{
          // rough average of the cell heights in the example
          // accurately setting this smooths out the scrolling experience
          estimatedRowHeight: 210,
        }}
        pagination={{
          ...pagination,
          pageSizeOptions: [50, 250, 1000],
          onChangeItemsPerPage: onChangeItemsPerPage,
          onChangePage: onChangePage,
        }}
      />
    </DataContext.Provider>
  );
};
