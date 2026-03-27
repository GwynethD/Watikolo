declare module 'react-date-range' {
  import * as React from 'react';

  export interface Range {
    startDate: Date;
    endDate: Date;
    key: string;
  }

  export interface RangeKeyDict {
    [key: string]: Range;
    selection: Range;
  }

  export interface DateRangeProps {
    ranges: Range[];
    onChange?: (ranges: RangeKeyDict) => void;
    minDate?: Date;
  }

  export class DateRange extends React.Component<DateRangeProps> {}
}
