import { StableToken } from '@celo/contractkit'
import { isVerified, rootLogger, TestUtils } from '@celo/phone-number-privacy-common'
import BigNumber from 'bignumber.js'
import allSettled from 'promise.allsettled'
import { getPerformedQueryCount } from '../../src/database/wrappers/account'
import { getRemainingQueryCount } from '../../src/signing/query-quota'
import { getContractKit } from '../../src/web3/contracts'

allSettled.shim()

const {
  ContractRetrieval,
  createMockAccounts,
  createMockAttestation,
  createMockContractKit,
  createMockToken,
  createMockWeb3,
} = TestUtils.Utils
const { mockAccount, mockPhoneNumber } = TestUtils.Values

jest.mock('../../src/web3/contracts')
const mockGetContractKit = getContractKit as jest.Mock
jest.mock('../../src/database/wrappers/account')
const mockPerformedQueryCount = getPerformedQueryCount as jest.Mock
jest.mock('@celo/phone-number-privacy-common', () => ({
  ...jest.requireActual('@celo/phone-number-privacy-common'),
  isVerified: jest.fn(),
}))
const mockIsVerified = isVerified as jest.Mock
// tslint:disable-next-line: no-object-literal-type-assertion

describe(getRemainingQueryCount, () => {
  it('Calculates remaining query count for verified account', async () => {
    const contractKitVerifiedNoTx = createMockContractKit(
      {
        [ContractRetrieval.getAttestations]: createMockAttestation(3, 3),
        [ContractRetrieval.getStableToken]: createMockToken(new BigNumber(200000000000000000)),
        [ContractRetrieval.getGoldToken]: createMockToken(new BigNumber(200000000000000000)),
        [ContractRetrieval.getAccounts]: createMockAccounts('0x0'),
      },
      createMockWeb3(5)
    )
    mockPerformedQueryCount.mockImplementation(() => new Promise((resolve) => resolve(2)))
    mockIsVerified.mockReturnValue(true)
    mockGetContractKit.mockImplementation(() => contractKitVerifiedNoTx)
    expect(await getRemainingQueryCount(rootLogger, mockAccount, mockPhoneNumber)).toEqual({
      performedQueryCount: 2,
      totalQuota: 60,
    })
  })
  it('Calculates remaining query count for unverified account', async () => {
    const contractKitVerifiedNoTx = createMockContractKit(
      {
        [ContractRetrieval.getAttestations]: createMockAttestation(0, 0),
        [ContractRetrieval.getStableToken]: createMockToken(new BigNumber(200000000000000000)),
        [ContractRetrieval.getGoldToken]: createMockToken(new BigNumber(200000000000000000)),
        [ContractRetrieval.getAccounts]: createMockAccounts('0x0'),
      },
      createMockWeb3(0)
    )
    mockGetContractKit.mockImplementation(() => contractKitVerifiedNoTx)
    mockPerformedQueryCount.mockImplementation(() => new Promise((resolve) => resolve(1)))
    mockIsVerified.mockReturnValue(false)
    expect(await getRemainingQueryCount(rootLogger, mockAccount, mockPhoneNumber)).toEqual({
      performedQueryCount: 1,
      totalQuota: 10,
    })
  })
  it('Calculates remaining query count for verified account with many txs', async () => {
    const contractKitVerifiedNoTx = createMockContractKit(
      {
        [ContractRetrieval.getAttestations]: createMockAttestation(3, 3),
        [ContractRetrieval.getStableToken]: createMockToken(new BigNumber(200000000000000000)),
        [ContractRetrieval.getGoldToken]: createMockToken(new BigNumber(200000000000000000)),
        [ContractRetrieval.getAccounts]: createMockAccounts('0x0'),
      },
      createMockWeb3(100)
    )
    mockPerformedQueryCount.mockImplementation(() => new Promise((resolve) => resolve(10)))
    mockIsVerified.mockReturnValue(true)
    mockGetContractKit.mockImplementation(() => contractKitVerifiedNoTx)
    expect(await getRemainingQueryCount(rootLogger, mockAccount, mockPhoneNumber)).toEqual({
      performedQueryCount: 10,
      totalQuota: 440,
    })
  })
  it('Calculates remaining query count for unverified account with many txs', async () => {
    const contractKitVerifiedNoTx = createMockContractKit(
      {
        [ContractRetrieval.getAttestations]: createMockAttestation(0, 0),
        [ContractRetrieval.getStableToken]: createMockToken(new BigNumber(200000000000000000)),
        [ContractRetrieval.getGoldToken]: createMockToken(new BigNumber(200000000000000000)),
        [ContractRetrieval.getAccounts]: createMockAccounts('0x0'),
      },
      createMockWeb3(100)
    )
    mockPerformedQueryCount.mockImplementation(() => new Promise((resolve) => resolve(0)))
    mockIsVerified.mockReturnValue(false)
    mockGetContractKit.mockImplementation(() => contractKitVerifiedNoTx)
    expect(await getRemainingQueryCount(rootLogger, mockAccount, mockPhoneNumber)).toEqual({
      performedQueryCount: 0,
      totalQuota: 410,
    })
  })
  it('Calculates remaining query count for unverified account without any balance', async () => {
    const contractKitVerifiedNoTx = createMockContractKit(
      {
        [ContractRetrieval.getAttestations]: createMockAttestation(0, 0),
        [ContractRetrieval.getStableToken]: createMockToken(new BigNumber(0)),
        [ContractRetrieval.getGoldToken]: createMockToken(new BigNumber(0)),
        [ContractRetrieval.getAccounts]: createMockAccounts('0x0'),
      },
      createMockWeb3(100)
    )
    mockPerformedQueryCount.mockImplementation(() => new Promise((resolve) => resolve(0)))
    mockIsVerified.mockReturnValue(false)
    mockGetContractKit.mockImplementation(() => contractKitVerifiedNoTx)
    expect(await getRemainingQueryCount(rootLogger, mockAccount, mockPhoneNumber)).toEqual({
      performedQueryCount: 0,
      totalQuota: 0,
    })
  })
  it('Calculates remaining query count for unverified account with cUSD balance', async () => {
    const contractKitVerifiedNoTx = createMockContractKit(
      {
        [ContractRetrieval.getAttestations]: createMockAttestation(0, 0),
        [ContractRetrieval.getStableToken]: createMockToken(new BigNumber(0)),
        [ContractRetrieval.getGoldToken]: createMockToken(new BigNumber(0)),
        [ContractRetrieval.getAccounts]: createMockAccounts('0x0'),
      },
      createMockWeb3(0)
    )
    contractKitVerifiedNoTx.contracts[ContractRetrieval.getStableToken] = jest.fn(
      (stableToken: StableToken) => {
        return stableToken === StableToken.cUSD
          ? createMockToken(new BigNumber(200000000000000000))
          : createMockToken(new BigNumber(0))
      }
    )
    mockPerformedQueryCount.mockImplementation(() => new Promise((resolve) => resolve(1)))
    mockIsVerified.mockReturnValue(false)
    mockGetContractKit.mockImplementation(() => contractKitVerifiedNoTx)
    expect(await getRemainingQueryCount(rootLogger, mockAccount, mockPhoneNumber)).toEqual({
      performedQueryCount: 1,
      totalQuota: 10,
    })
  })
  it('Calculates remaining query count for unverified account with cEUR balance', async () => {
    const contractKitVerifiedNoTx = createMockContractKit(
      {
        [ContractRetrieval.getAttestations]: createMockAttestation(0, 0),
        [ContractRetrieval.getStableToken]: createMockToken(new BigNumber(0)),
        [ContractRetrieval.getGoldToken]: createMockToken(new BigNumber(0)),
        [ContractRetrieval.getAccounts]: createMockAccounts('0x0'),
      },
      createMockWeb3(0)
    )
    contractKitVerifiedNoTx.contracts[ContractRetrieval.getStableToken] = jest.fn(
      (stableToken: StableToken) => {
        return stableToken === StableToken.cEUR
          ? createMockToken(new BigNumber(200000000000000000))
          : createMockToken(new BigNumber(0))
      }
    )
    mockPerformedQueryCount.mockImplementation(() => new Promise((resolve) => resolve(1)))
    mockIsVerified.mockReturnValue(false)
    mockGetContractKit.mockImplementation(() => contractKitVerifiedNoTx)
    expect(await getRemainingQueryCount(rootLogger, mockAccount, mockPhoneNumber)).toEqual({
      performedQueryCount: 1,
      totalQuota: 10,
    })
  })
  it('Calculates remaining query count for unverified account with only CELO balance', async () => {
    const contractKitVerifiedNoTx = createMockContractKit(
      {
        [ContractRetrieval.getAttestations]: createMockAttestation(0, 0),
        [ContractRetrieval.getStableToken]: createMockToken(new BigNumber(0)),
        [ContractRetrieval.getGoldToken]: createMockToken(new BigNumber(200000000000000000)),
        [ContractRetrieval.getAccounts]: createMockAccounts('0x0'),
      },
      createMockWeb3(0)
    )
    mockPerformedQueryCount.mockImplementation(() => new Promise((resolve) => resolve(1)))
    mockIsVerified.mockReturnValue(false)
    mockGetContractKit.mockImplementation(() => contractKitVerifiedNoTx)
    expect(await getRemainingQueryCount(rootLogger, mockAccount, mockPhoneNumber)).toEqual({
      performedQueryCount: 1,
      totalQuota: 10,
    })
  })
  it('No phone number hash when request own phone number', async () => {
    const contractKitVerifiedNoTx = createMockContractKit(
      {
        [ContractRetrieval.getAttestations]: createMockAttestation(0, 0),
        [ContractRetrieval.getStableToken]: createMockToken(new BigNumber(200000000000000000)),
        [ContractRetrieval.getGoldToken]: createMockToken(new BigNumber(200000000000000000)),
        [ContractRetrieval.getAccounts]: createMockAccounts('0x0'),
      },
      createMockWeb3(0)
    )
    mockPerformedQueryCount.mockImplementation(() => new Promise((resolve) => resolve(0)))
    mockGetContractKit.mockImplementation(() => contractKitVerifiedNoTx)
    expect(await getRemainingQueryCount(rootLogger, mockAccount, undefined)).toEqual({
      performedQueryCount: 0,
      totalQuota: 10,
    })
  })
})
