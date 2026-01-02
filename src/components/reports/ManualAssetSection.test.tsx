import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ManualAssetSection } from './ManualAssetSection';
import { AssetGroup } from '../../services/report.service';

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

  it('should render section with title', () => {
    render(<ManualAssetSection title="Assets" groups={mockGroups} currencyId="usd" />);
    expect(screen.getByText('Assets')).toBeInTheDocument();
  });

  it('should render all groups', () => {
    render(<ManualAssetSection title="Assets" groups={mockGroups} currencyId="usd" />);
    expect(screen.getByText('Bank Accounts')).toBeInTheDocument();
    expect(screen.getByText('Investments')).toBeInTheDocument();
  });

  it('should render all items within groups', () => {
    render(<ManualAssetSection title="Assets" groups={mockGroups} currencyId="usd" />);
    expect(screen.getByText('Checking')).toBeInTheDocument();
    expect(screen.getByText('Savings')).toBeInTheDocument();
    expect(screen.getByText('Stock Portfolio')).toBeInTheDocument();
  });

  it('should display subtotals for each group', () => {
    render(<ManualAssetSection title="Assets" groups={mockGroups} currencyId="usd" />);
    const subtotals = screen.getAllByText('Subtotal');
    expect(subtotals).toHaveLength(2);
  });

  it('should display total', () => {
    render(<ManualAssetSection title="Assets" groups={mockGroups} currencyId="usd" />);
    expect(screen.getByText('Total Assets')).toBeInTheDocument();
  });

  it('should not render when groups are empty', () => {
    const { container } = render(
      <ManualAssetSection title="Assets" groups={[]} currencyId="usd" />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should format currency values', () => {
    render(<ManualAssetSection title="Assets" groups={mockGroups} currencyId="usd" />);
    // Values should be formatted with currency symbol
    expect(screen.getByText(/\$2000\.00/)).toBeInTheDocument();
    expect(screen.getByText(/\$3000\.00/)).toBeInTheDocument();
  });

  it('should calculate and display correct total', () => {
    render(<ManualAssetSection title="Assets" groups={mockGroups} currencyId="usd" />);
    // Total should be sum of all group totals (5000 + 10000 = 15000)
    expect(screen.getByText(/\$15000\.00/)).toBeInTheDocument();
  });

  it('should render table structure', () => {
    render(<ManualAssetSection title="Assets" groups={mockGroups} currencyId="usd" />);
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('should have correct table headers', () => {
    render(<ManualAssetSection title="Assets" groups={mockGroups} currencyId="usd" />);
    expect(screen.getByText('Type')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Value')).toBeInTheDocument();
  });

  it('should handle single group', () => {
    const singleGroup = [mockGroups[0]];
    render(<ManualAssetSection title="Assets" groups={singleGroup} currencyId="usd" />);
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
    render(<ManualAssetSection title="Assets" groups={singleItemGroup} currencyId="usd" />);
    expect(screen.getByText('Wallet')).toBeInTheDocument();
    expect(screen.getAllByText(/\$1000\.00/).length).toBeGreaterThan(0);
  });
});
