import { screen } from '@testing-library/react';
import { renderWithProviders as render } from '@/test-utils';
import '@testing-library/jest-dom';
import { ManualAssetSection } from './ManualAssetSection';
import { AssetGroup } from '@/services/report.service';
import { CurrencyCode } from '@/types/enums';

describe('ManualAssetSection', () => {
  const mockGroups: AssetGroup[] = [
    {
      name: 'Bank Accounts',
      total: 5000,
      items: [
        { id: 'item1', name: 'Checking', value: 2000, type: 'bank_account' },
        { id: 'item2', name: 'Savings', value: 3000, type: 'bank_account' },
      ],
    },
    {
      name: 'Investments',
      total: 10000,
      items: [{ id: 'item3', name: 'Stock Portfolio', value: 10000, type: 'investment' }],
    },
  ];

  const renderComponent = (props: {
    title: string;
    groups: AssetGroup[];
    currencyCode: CurrencyCode;
  }) => {
    return render(<ManualAssetSection {...props} />);
  };

  it('should render section with title', () => {
    renderComponent({ title: 'Assets', groups: mockGroups, currencyCode: CurrencyCode.USD });
    expect(screen.getByText('Assets')).toBeInTheDocument();
  });

  it('should render all groups', () => {
    renderComponent({ title: 'Assets', groups: mockGroups, currencyCode: CurrencyCode.USD });
    expect(screen.getByText('Bank Accounts')).toBeInTheDocument();
    expect(screen.getByText('Investments')).toBeInTheDocument();
  });

  it('should render all items within groups', () => {
    renderComponent({ title: 'Assets', groups: mockGroups, currencyCode: CurrencyCode.USD });
    expect(screen.getByText('Checking')).toBeInTheDocument();
    expect(screen.getByText('Savings')).toBeInTheDocument();
    expect(screen.getByText('Stock Portfolio')).toBeInTheDocument();
  });

  it('should display subtotals for each group', () => {
    renderComponent({ title: 'Assets', groups: mockGroups, currencyCode: CurrencyCode.USD });
    const subtotals = screen.getAllByText('Subtotal');
    expect(subtotals).toHaveLength(2);
  });

  it('should display total', () => {
    renderComponent({ title: 'Assets', groups: mockGroups, currencyCode: CurrencyCode.USD });
    expect(screen.getByText('Total Assets')).toBeInTheDocument();
  });

  it('should not render when groups are empty', () => {
    const { container } = renderComponent({
      title: 'Assets',
      groups: [],
      currencyCode: CurrencyCode.USD,
    });
    expect(container.firstChild).toBeNull();
  });

  it('should format currency values', () => {
    renderComponent({ title: 'Assets', groups: mockGroups, currencyCode: CurrencyCode.USD });
    // Values should be formatted with currency symbol
    expect(screen.getByText(/\$2,000\.00/)).toBeInTheDocument();
    expect(screen.getByText(/\$3,000\.00/)).toBeInTheDocument();
  });

  it('should calculate and display correct total', () => {
    renderComponent({ title: 'Assets', groups: mockGroups, currencyCode: CurrencyCode.USD });
    // Total should be sum of all group totals (5000 + 10000 = 15000)
    expect(screen.getByText(/\$15,000\.00/)).toBeInTheDocument();
  });

  it('should render table structure', () => {
    renderComponent({ title: 'Assets', groups: mockGroups, currencyCode: CurrencyCode.USD });
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('should have correct table headers', () => {
    renderComponent({ title: 'Assets', groups: mockGroups, currencyCode: CurrencyCode.USD });
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Value')).toBeInTheDocument();
  });

  it('should handle single group', () => {
    const singleGroup = [mockGroups[0]];
    renderComponent({ title: 'Assets', groups: singleGroup, currencyCode: CurrencyCode.USD });
    expect(screen.getByText('Bank Accounts')).toBeInTheDocument();
    expect(screen.getByText('Checking')).toBeInTheDocument();
  });

  it('should handle single item in group', () => {
    const singleItemGroup: AssetGroup[] = [
      {
        name: 'Cash',
        total: 1000,
        items: [{ id: 'item1', name: 'Wallet', value: 1000, type: 'cash' }],
      },
    ];
    renderComponent({ title: 'Assets', groups: singleItemGroup, currencyCode: CurrencyCode.USD });
    expect(screen.getByText('Wallet')).toBeInTheDocument();
    expect(screen.getAllByText(/\$1,000\.00/).length).toBeGreaterThan(0);
  });
});
