/**
 * The studio's icons.
 *
 * Inline and stroke-drawn on one 20-unit grid, sized in `em` and coloured by
 * `currentColor`, so an icon takes the size and colour of the control it sits
 * in and costs no request, no sprite and no icon font a host might block.
 *
 * Every icon is decorative. The control carrying it has the accessible name,
 * so they are hidden from assistive technology here rather than at each use.
 */
function Icon({ children, size = '1.15em', ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export const UndoIcon = (props) => (
  <Icon {...props}>
    <path d="M7.5 4.5 4 8l3.5 3.5" />
    <path d="M4.5 8H12a4 4 0 0 1 0 8H9" />
  </Icon>
);

export const RedoIcon = (props) => (
  <Icon {...props}>
    <path d="M12.5 4.5 16 8l-3.5 3.5" />
    <path d="M15.5 8H8a4 4 0 0 0 0 8h3" />
  </Icon>
);

export const CloseIcon = (props) => (
  <Icon {...props}>
    <path d="m5.5 5.5 9 9M14.5 5.5l-9 9" />
  </Icon>
);

/** Points towards the inline end in left-to-right text. Mirror it where needed. */
export const ChevronIcon = (props) => (
  <Icon {...props}>
    <path d="m8 4.5 5.5 5.5L8 15.5" />
  </Icon>
);

export const UploadIcon = (props) => (
  <Icon {...props}>
    <path d="M10 12.5V3.5" />
    <path d="m6.5 7 3.5-3.5L13.5 7" />
    <path d="M3.5 12.5v3a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-3" />
  </Icon>
);

export const DownloadIcon = (props) => (
  <Icon {...props}>
    <path d="M10 3.5v9" />
    <path d="m6.5 9 3.5 3.5L13.5 9" />
    <path d="M3.5 16.5h13" />
  </Icon>
);

export const MoveIcon = (props) => (
  <Icon {...props}>
    <path d="M10 3v14M3 10h14" />
    <path d="M8 5l2-2 2 2M8 15l2 2 2-2M5 8l-2 2 2 2M15 8l2 2-2 2" />
  </Icon>
);

export const InfoIcon = (props) => (
  <Icon {...props}>
    <circle cx="10" cy="10" r="7" />
    <path d="M10 9v4.5" />
    <path d="M10 6.5v.01" strokeWidth="2" />
  </Icon>
);

export const TextIcon = (props) => (
  <Icon {...props}>
    <path d="M4.5 5.5v-1.5h11v1.5" />
    <path d="M10 4v12" />
    <path d="M7.5 16h5" />
  </Icon>
);

export const PlusIcon = (props) => (
  <Icon {...props}>
    <path d="M10 4.5v11" />
    <path d="M4.5 10h11" />
  </Icon>
);

export const TrashIcon = (props) => (
  <Icon {...props}>
    <path d="M4 6h12" />
    <path d="M8 6V4.5h4V6" />
    <path d="m5.5 6 .7 9.5a1 1 0 0 0 1 .9h5.6a1 1 0 0 0 1-.9L14.5 6" />
  </Icon>
);

/** Paragraph alignment: `align` is 'left', 'center' or 'right'. */
export const AlignIcon = ({ align = 'center', ...props }) => {
  const rows = [5, 9, 13];
  const [a, b, c] = align === 'left' ? [[3.5, 16.5], [3.5, 12], [3.5, 14.5]]
    : align === 'right' ? [[3.5, 16.5], [8, 16.5], [5.5, 16.5]]
    : [[3.5, 16.5], [6, 14], [4.75, 15.25]];
  return (
    <Icon {...props}>
      {[a, b, c].map(([x1, x2], i) => (
        <path key={rows[i]} d={`M${x1} ${rows[i]}H${x2}`} />
      ))}
    </Icon>
  );
};
