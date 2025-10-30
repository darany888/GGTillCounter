import React, { useState } from 'react';
import Currency from '../components/Currency';
import Denomination from '../components/Denomination';
import { CurrencyValues, Denom } from '../types';
import logo from '../assets/logo.webp';

type Breakdown = Record<string, number>
function TillCounter(): JSX.Element {
    const [denoms, setDenoms] = useState<Denom[]>([]);
    const [currency, setCurrency] = useState('NZD');
    const [reverse, setReverse] = useState(true);

    const [expectedCashUp, setExpectedCashUp] = useState<number>(0);
    const [floatAmount, setFloatAmount] = useState<number>(200);
    const [today] = useState<string>(new Date().toLocaleDateString());
    const [varianceReason, setVarianceReason] = useState<string>('');

    // Calculations must be done inside the function or just before render/send
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
        // Corrected for TypeScript error (TS2339) and to reset textarea
        Array.from(document.querySelectorAll('input, textarea')).forEach(
            (element) => {
                const input = element as HTMLInputElement | HTMLTextAreaElement;
                input.value = ''; 
            }
        );
        setDenoms(() => []);
        setReverse(() => true);
        setVarianceReason(() => '');
        setExpectedCashUp(0); // Resetting custom inputs
        setFloatAmount(200); // Resetting custom inputs (or desired default)
        addDenomValues();
    };

    const handleReverse = () => {
        reverse ? setReverse(() => false) : setReverse(() => true);
    }; 

    function addDenomValues() {
        if (denoms.length > 0) {
            return denoms.map((denomItem) => {
                const valueString = denomItem.denom.split('-')[1];
                const denominationValue = parseFloat(valueString) || 0;
                return denomItem.value * denominationValue * 100;
            }).reduce((a, b) => a + b, 0); 
        }
        return 0;
    }

    function fillCurrency(currency: string): CurrencyValues {
        const currencies: Array<CurrencyValues> = [
            { code: 'AUD', symbol: '$', values: [100, 50, 20, 10, 5, 2, 1, 0.5, 0.2, 0.1, 0.05] },
            { code: 'EUR', symbol: '€', values: [500, 200, 100, 50, 20, 10, 5, 2, 1, 0.5, 0.2, 0.1, 0.05, 0.02, 0.01] },
            { code: 'JPY', symbol: '¥', values: [10000, 5000, 2000, 1000, 500, 100, 50, 10, 5, 1] },
            { code: 'NZD', symbol: '$', values: [100, 50, 20, 10, 5, 2, 1, 0.5, 0.2, 0.1, 0.05] },
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
    
// ⭐ NEW: GREEDY ALGORITHM FUNCTION ⭐
    const getBankBreakdown = (amount: number): Breakdown => {
        let remaining = Math.round(amount * 100); // Work with cents to avoid floating point issues
        const breakdown: Breakdown = {};
        
        // Get sorted list of denomination values (largest to smallest)
        const denominations = fillCurrency(currency).values.slice().sort((a, b) => b - a);

        for (const denomValue of denominations) {
            const valueInCents = Math.round(denomValue * 100);
            
            if (remaining >= valueInCents) {
                const count = Math.floor(remaining / valueInCents);
                // Store the count with the original dollar value as the key
                breakdown[denomValue.toFixed(2)] = count; 
                remaining -= count * valueInCents;
            }
        }
        return breakdown;
    };

    // ⭐ GOOGLE SHEET SEND FUNCTION ⭐
    const handleSendToSheet = async () => {
        const currentGrandTotal = addDenomValues() / 100;
        const currentActualToBank = currentGrandTotal - floatAmount;
        const currentDiscrepancy = currentGrandTotal - expectedCashUp - floatAmount;

        // Prepare Denomination Data (Keys MUST match Google Sheet headers exactly!)
        const denomData = denoms.reduce((acc, item) => {
            const denomValue = parseFloat(item.denom.split('-')[1]);
            // IMPORTANT: Keys use DOTs (100.00_count) to match the Apps Script headers
            acc[`${denomValue.toFixed(2)}_count`] = item.value; 
            return acc;
        }, {} as Record<string, number>);

        const payload = {
            Date: today,
            Currency: currency,
            Grand_Total: currentGrandTotal.toFixed(2),
            Expected_Cash_Up: expectedCashUp.toFixed(2),
            Float_Amount: floatAmount.toFixed(2),
            Actual_To_Bank: currentActualToBank.toFixed(2),
            Discrepancy: currentDiscrepancy.toFixed(2),
            Variance_Reason: varianceReason,
            ...denomData 
        };
        
        console.log("Sending Payload:", payload);

        //  PASTE YOUR DEPLOYED GOOGLE APPS SCRIPT WEB APP URL HERE 
        const GOOGLE_SHEET_ENDPOINT = "https://script.google.com/macros/s/AKfycbzASroH-9PKUEfhptUs5LboDa7FbdR9nZ5yi7EuqhB-uWUqlchzKjfelYhNiLkgFEUM/exec"; 

        try {
            const response = await fetch(GOOGLE_SHEET_ENDPOINT, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            
            console.log('Data transfer initiated (check Google Sheet)!');
            alert('Till data sent successfully!');

        } catch (error) {
            console.error('Error sending data to Google Sheet:', error);
            alert('Error sending data. Check console.');
        }
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
    
    // --- OUTPUT RENDERING ---
    
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

// Component to display the bank deposit breakdown
    const BankBreakdownOutput = (): JSX.Element => {
        // Calculate the breakdown using the Actual Banking amount
        const breakdown = getBankBreakdown(actualToBank);
        const symbol = fillCurrency(currency).symbol;

        // Get the denomination values from largest to smallest for display order
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

    const Reset = (): JSX.Element => {
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

    const ReverseCheck = (): JSX.Element => {
        return (
            <div className="reverse">
                <label>Reverse: </label>
                <input type="checkbox" checked={reverse} onChange={handleReverse} />
            </div>
        );
    };

    const Total = (): JSX.Element => {
        return (
            <div className="total">
                <p>
                    <b>Total: </b>
                    <span className="total-span">
                        {denominations.symbol}
                        {(addDenomValues() / 100).toFixed(2)}
                    </span>
                </p>
            </div>
        );
    };
    
    // --- FINAL RENDER ---

    const currentGrandTotal = addDenomValues() / 100;
    const currentActualToBank = currentGrandTotal - floatAmount;
    const currentDiscrepancy = currentGrandTotal - expectedCashUp - floatAmount;


    return (
        <div className="tillcounter">
            {/*<img src={logo} alt="Glou Glou Cashup Logo" className="logo" /> */}
            <ReverseCheck />
            <p><b>Today&apos;s Date:</b> {today}</p>

            <TotalHeader />
            {outputs}
            <hr />
            <Total />
            
            {/* Float Amount moved out of cashup div to match your structure */}
            <div className="cashup-row">
                <label>Float Amount: </label>
                <input
                    type="number"
                    value={floatAmount}
                    onChange={(e) => setFloatAmount(parseFloat(e.target.value))}
                    step="0.01"
                />
            </div>
            
            <div className="cashup">
                <div className="cashup-row">
                    <label>Expected Cash Up: </label>
                    <input
                        type="number"
                        value={expectedCashUp}
                        onChange={(e) => setExpectedCashUp(parseFloat(e.target.value))}
                        step="0.01"
                    />
                </div>
            
                <p className="to-bank-output">
                    <b>Actual Banking: </b>
                    <span className="total-span">
                        {denominations.symbol}
                        {currentActualToBank.toFixed(2)}
                    </span>
                </p>
                {/* ⭐ NEW OUTPUT LOCATION ⭐ */}
                <BankBreakdownOutput />
                <p>
                    <b>Discrepancy: </b>
                    <span style={{ color: currentDiscrepancy === 0 ? 'green' : 'red' }}>
                        {denominations.symbol}{currentDiscrepancy.toFixed(2)}
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