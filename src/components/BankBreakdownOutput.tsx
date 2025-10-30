import React from 'react';
import { Denom, CurrencyValues } from '../types';

// --- TYPE DEFINITIONS ---
type Breakdown = Record<string, number>;

interface BankBreakdownProps {
    actualToBank: number;
    denoms: Denom[]; // The user's counted cash
}
// ------------------------

// NOTE: You must also move or define the fillCurrency and getBankBreakdown functions
// If fillCurrency is defined in TillCounter.tsx, you must move it here or import it.
// Assuming fillCurrency is defined locally in this new file for simplicity.

function fillCurrency(currency: string, reverse: boolean = false): CurrencyValues {
    const currencies: Array<CurrencyValues> = [
        { code: 'AUD', symbol: '$', values: [100, 50, 20, 10, 5, 2, 1, 0.5, 0.2, 0.1, 0.05] },
        { code: 'EUR', symbol: '€', values: [500, 200, 100, 50, 20, 10, 5, 2, 1, 0.5, 0.2, 0.1, 0.05, 0.02, 0.01] },
        { code: 'JPY', symbol: '¥', values: [10000, 5000, 2000, 1000, 500, 100, 50, 10, 5, 1] },
        { code: 'NZD', symbol: '$', values: [100, 50, 20, 10, 5, 2, 1, 0.5, 0.2, 0.1, 0.05] },
        { code: 'USD', symbol: '$', values: [100, 50, 20, 10, 5, 2, 1, 0.5, 0.25, 0.1, 0.05, 0.01] }
    ];

    const denominations = currencies.find((object) => object.code === currency) || currencies[3]; // Default to NZD
    if (reverse === true) {
        denominations.values.reverse();
    }
    return denominations;
}

// --- GREEDY SELECTION ALGORITHM (CORE LOGIC) ---
const getCashMap = (denoms: Denom[]) => {
    return denoms.reduce((acc, item) => {
        const valueKey = item.denom.split('-')[1]; 
        acc[valueKey] = item.value;
        return acc;
    }, {} as Record<string, number>);
};

const getBankBreakdown = (amount: number, denoms: Denom[], currency: string): Breakdown => {
    let targetInCents = Math.round(amount * 100);
    const breakdown: Breakdown = {};
    const availableCash = getCashMap(denoms); 
    
    // Denominations sorted large to small
    const denominations = fillCurrency(currency).values.slice().sort((a, b) => b - a);

    for (const denomValue of denominations) {
        const valueKey = denomValue.toFixed(2);
        const valueInCents = Math.round(denomValue * 100);
        
        const availableCount = availableCash[valueKey] || 0;
        const neededCount = Math.floor(targetInCents / valueInCents);

        const bankCount = Math.min(neededCount, availableCount);

        if (bankCount > 0) {
            breakdown[valueKey] = bankCount; 
            targetInCents -= bankCount * valueInCents;
            
            if (targetInCents <= 0) break;
        }
    }
    
    if (targetInCents > 0) {
        console.warn(`Breakdown missed $${(targetInCents / 100).toFixed(2)} due to denomination shortage.`);
    }

    return breakdown;
};
// ---------------------------------------------


// Component to display the bank deposit breakdown
const BankBreakdownOutput = ({ actualToBank, denoms }: BankBreakdownProps): JSX.Element => {
    // NOTE: Hardcoding 'NZD' here because the currency state is not passed easily
    // If you need to change currency, you will need to pass 'currency' as a prop too.
    const breakdown = getBankBreakdown(actualToBank, denoms, 'NZD'); 
    const symbol = fillCurrency('NZD').symbol;

    const sortedDenoms = Object.keys(breakdown).sort((a, b) => parseFloat(b) - parseFloat(a));

    if (actualToBank <= 0) {
        return (
            <div className="bank-breakdown">
                <p className="breakdown-header">
                    <b>Bank Deposit Breakdown:</b>
                </p>
                <p className="breakdown-item">No cash to bank.</p>
            </div>
        );
    }

    return (
        <div className="bank-breakdown">
            <p className="breakdown-header">
                <b>Bank Deposit Breakdown:</b>
            </p>
            <div className="breakdown-list">
                {sortedDenoms.map((valueStr) => (
                    <p key={valueStr} className="breakdown-item">
                        {breakdown[valueStr]} x {symbol}{valueStr}
                    </p>
                ))}
            </div>
        </div>
    );
};

export default BankBreakdownOutput;