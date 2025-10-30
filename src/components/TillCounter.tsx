import React, { useState } from 'react';
import Currency from '../components/Currency';
import Denomination from '../components/Denomination';
import { CurrencyValues, Denom } from '../types';

// --- TYPE DEFINITIONS ---
type Breakdown = Record<string, number>;

interface BankBreakdownProps {
    actualToBank: number;
    denoms: Denom[]; 
}
// ------------------------

function TillCounter(): JSX.Element {
    const [denoms, setDenoms] = useState<Denom[]>([]);
    const [currency] = useState('NZD'); // Using NZD as default currency
    const [reverse, setReverse] = useState(true);

    const [expectedCashUp, setExpectedCashUp] = useState<number>(0);
    const [floatAmount, setFloatAmount] = useState<number>(200);
    const [today] = useState<string>(
    new Date().toLocaleDateString('en-NZ', { day: '2-digit', month: '2-digit', year: 'numeric' }));
    const [varianceReason, setVarianceReason] = useState<string>('');

    // --- MAIN CALCULATIONS ---
    // Defined once at the top level of the component's render cycle
    const grandTotal = addDenomValues() / 100;
    const actualToBank = grandTotal - floatAmount;
    const discrepancy = grandTotal - expectedCashUp - floatAmount;

    // --- LOGIC FUNCTIONS ---

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const denom: string = event.target.id;
        const count: number = parseInt(event.target.value) || 0; 
        const index = denoms.findIndex((x) => x.denom === denom);

        if (index === -1) {
            setDenoms((oldDenoms) => [...oldDenoms, { denom, value: count }]);
        }

        if (index > -1) {
            setDenoms((oldDenoms) => [
                ...oldDenoms.slice(0, index),
                { denom, value: count },
                ...oldDenoms.slice(index + 1)
            ]);
        }
    };

    const handleBlur = () => {
        if (denoms.length > 0) {
            addDenomValues();
        }
    };

    const handleReset = () => {
        Array.from(document.querySelectorAll('input, textarea')).forEach(
            (element) => {
                const input = element as HTMLInputElement | HTMLTextAreaElement;
                input.value = ''; 
            }
        );
        setDenoms(() => []);
        setReverse(() => true);
        setVarianceReason(() => '');
        setExpectedCashUp(0);
        setFloatAmount(200);
        addDenomValues();
    };

    const handleReverse = () => {
        reverse ? setReverse(() => false) : setReverse(() => true);
    }; 

// --- (Handles decimals reliably) ---
function addDenomValues() {
    if (denoms.length > 0) {
        return denoms.map((denomItem) => {
            const valueString = denomItem.denom.split('-')[1];
            const denominationValue = parseFloat(valueString) || 0;
            
            // Use Math.round to safely convert to cents and avoid floating point errors
            const valueInCents = Math.round(denominationValue * 100);
            
            return denomItem.value * valueInCents;
        }).reduce((a, b) => a + b, 0); 
    }
    return 0;
}

    function fillCurrency(currency: string): CurrencyValues {
        const currencies: Array<CurrencyValues> = [
            { code: 'AUD', symbol: '$', values: [100, 50, 20, 10, 5, 2, 1, 0.5, 0.2, 0.1, 0.05] },
            { code: 'EUR', symbol: '€', values: [500, 200, 100, 50, 20, 10, 5, 2, 1, 0.5, 0.2, 0.1, 0.05, 0.02, 0.01] },
            { code: 'JPY', symbol: '¥', values: [10000, 5000, 2000, 1000, 500, 100, 50, 10, 5, 1] },
            { code: 'NZD', symbol: '$', values: [100, 50, 20, 10, 5, 2, 1, 0.5, 0.2, 0.1] },
            { code: 'USD', symbol: '$', values: [100, 50, 20, 10, 5, 2, 1, 0.5, 0.25, 0.1, 0.05, 0.01] }
        ];

        const denominations = currencies.find((object) => object.code === currency) || currencies[0];
        if (reverse === true) {
            denominations.values.reverse();
        }
        return denominations;
    }

    function getRegexString(value: number) {
        const regexStrings: { [key: number]: string } = {
            10000: '([0-9]*0000|0).00', 5000: '([0-9]*[05]000|0).00', 2000: '([0-9]*[02468]000|0).00', 
            1000: '([0-9]*000|0).00', 500: '([0-9]*[05]00|0).00', 200: '([0-9]*[02468]00|0).00', 
            100: '([0-9]*00|0).00', 50: '([0-9]*[05]0|0).00', 20: '([0-9]*[02468]0|0).00', 
            10: '[0-9]*0.00', 5: '[0-9]*[05]', 2: '[0-9]*[02468]', 1: '[0-9]+.00', 
            0.5: '[0-9]+.(0|5)0', 0.25: '[0-9]+.(00|25|50|75)', 0.2: '[0-9]+.[02468]0', 
            0.1: '[0-9]+.[0-9]0', 0.05: '[0-9]+.[0-9](0|5)', 0.02: '[0-9]+.[0-9][02468]', 
            0.01: '[0-9]+.[0-9]{2}'
        };
        return regexStrings[value] || '';
    }
    
// --- (Standardized keys for map matching breakdown logic) ---
const getCashMap = (denoms: Denom[]) => {
    return denoms.reduce((acc, item) => {
        const valueString = item.denom.split('-')[1];
        
        // to a standardized, two-decimal string key (e.g., '5.00' or '0.50')
        const valueKeyFixed = parseFloat(valueString).toFixed(2);
        
        acc[valueKeyFixed] = item.value;
        return acc;
    }, {} as Record<string, number>);
};

    const getBankBreakdown = (amount: number, denoms: Denom[]): Breakdown => {
        let targetInCents = Math.round(amount * 100);
        const breakdown: Breakdown = {};
        const availableCash = getCashMap(denoms); 
        
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

// --- GOOGLE SHEET SEND FUNCTION ---
    const handleSendToSheet = async () => {
        // 1. Recalculate totals
        const currentGrandTotal = addDenomValues() / 100;
        const currentActualToBank = currentGrandTotal - floatAmount;
        const currentDiscrepancy = currentGrandTotal - expectedCashUp - floatAmount;

        // 2. GET THE BANKING BREAKDOWN
        const bankBreakdown = getBankBreakdown(currentActualToBank, denoms); 

        // 3. DEFINE FIXED ORDER FOR DENOMINATION HEADERS
        const denominations = fillCurrency(currency); // Get the standard currency list
        // Sort large to small, which is a common spreadsheet order.
        const orderedDenominations = denominations.values.slice().sort((a, b) => b - a);
        
        // 4. TRANSFORM BREAKDOWN INTO PAYLOAD FORMAT
        const orderedDenomData = orderedDenominations.reduce((acc, denomValue) => {
            const valueStr = denomValue.toFixed(2);
            const key = `${valueStr}_count`;
            
            // Use the banked count, or 0 if that denomination was not banked
            acc[key] = bankBreakdown[valueStr] || 0; 
            return acc;
        }, {} as Record<string, number>);


        // 5. CONSTRUCT THE FINAL PAYLOAD
        const payload = {
            Date: today,
            Currency: currency,
            
            // Financial totals (Order is fixed here)
            Grand_Total: currentGrandTotal.toFixed(2),
            Expected_Cash_Up: expectedCashUp.toFixed(2),
            Float_Amount: floatAmount.toFixed(2),
            Actual_To_Bank: currentActualToBank.toFixed(2),
            Discrepancy: currentDiscrepancy.toFixed(2),
            Variance_Reason: varianceReason,
            
            // ...SPREAD the ORDERED bank breakdown data here...
            ...orderedDenomData 
        };
        
        console.log("Sending ORDERED Banking Payload:", payload);

        const GOOGLE_SHEET_ENDPOINT = "https://script.google.com/macros/s/AKfycbzASroH-9PKUEfhptUs5LboDa7FbdR9nZ5yi7EuqhB-uWUqlchzKjfelYhNiLkgFEUM/exec"; 

        try {
            await fetch(GOOGLE_SHEET_ENDPOINT, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            
            console.log('Bank data transfer initiated (check Google Sheet)!');
            alert('Till data sent successfully!');

        } catch (error) {
            console.error('Error sending data to Google Sheet:', error);
            alert('Error sending data. Check console.');
        }
    };

    // --- DISPLAY COMPONENTS ---
    const TotalHeader = (): JSX.Element => {
        return (
            <div className="denominations-header">
                <span className="header-denom">Coins/Notes</span>
                <span className="header-count">Till</span>
                <span className="header-total">Total</span>
            </div>
        )
    }

    const Total = (): JSX.Element => {
        return (
            <div className="total">
                <p>
                    <b>Total: </b>
                    <span className="total-span">
                        {denominations.symbol}
                        {(grandTotal).toFixed(2)}
                    </span>
                </p>
            </div>
        );
    };

    const ReverseCheck = (): JSX.Element => {
        return (
            <div className="reverse">
                <label>Reverse: </label>
                <input type="checkbox" checked={reverse} onChange={handleReverse} />
            </div>
        );
    };

    const ResetAndSend = (): JSX.Element => {
        return (
            <div className="reset-send-container">
                <button onClick={handleSendToSheet} className="send-button">
                    Send to Google Sheet
                </button>
                <button onClick={handleReset} className="reset-button">
                    Reset
                </button>
            </div>
        );
    };

    const BankBreakdownOutput = ({ actualToBank, denoms }: BankBreakdownProps): JSX.Element => {
        const breakdown = getBankBreakdown(actualToBank, denoms); 
        const symbol = fillCurrency(currency).symbol;

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


    // --- FINAL RENDER SETUP ---

    const denominations = fillCurrency(currency);
    const outputs: JSX.Element[] = [];
    
    denominations.values.forEach((value) => {
        const denomId = `denom-${value.toString()}`; 
        const index = denoms.findIndex((x) => x.denom === denomId);

        const storedCount = index > -1 ? denoms[index].value : 0; 
        const rowTotal = storedCount * value;

        outputs.push(
            <Denomination
                key={denomId}
                symbol={denominations.symbol}
                denomination={value}
                count={storedCount} 
                rowTotal={rowTotal} 
                regex={getRegexString(value)}
                onChange={handleChange}
                onBlur={handleBlur}
            />
        );
    });

    return (
        <div className="tillcounter">
            <ReverseCheck />
            <p><b>Today&apos;s Date:</b> {today}</p>

            <TotalHeader />
            {outputs}
            <hr />
            <Total />
            
            <div className="cashup-row">
                <label>Float Amount: </label>
                <input
                    type="number"
                    value={floatAmount}
                    onChange={(e) => setFloatAmount(parseFloat(e.target.value))}
                    step="10"
                />
            </div>
            
            <div className="cashup">
                <div className="cashup-row">
                    <label>Expected Cash Up: </label>
                    <input
                        type="number"
                        value={expectedCashUp === 0 ? '' : expectedCashUp}
                        onChange={(e) => setExpectedCashUp(parseFloat(e.target.value))}
                        step="10"
                    />
                </div>
            
                <p className="to-bank-output">
                    <b>Actual Banking: </b>
                    <span className="total-span">
                        {denominations.symbol}
                        {actualToBank.toFixed(2)}
                    </span>
                </p>

                <BankBreakdownOutput
                    actualToBank={actualToBank}
                    denoms={denoms} 
                />
                
                <p>
                    <b>Discrepancy: </b>
                    <span style={{ color: discrepancy === 0 ? 'green' : 'red' }}>
                        {denominations.symbol}{discrepancy.toFixed(2)}
                    </span>
                </p>
            </div>
            
            <div className="variance-reason">
                <label>Reason for Variance:</label>
                <textarea
                    value={varianceReason}
                    onChange={(e) => setVarianceReason(e.target.value)}
                    rows={3} 
                    className="reason-input"
                    placeholder="Please give reasons for variances"
                />
            </div>
            
            <ResetAndSend />
        </div>
    );
}

export default TillCounter;