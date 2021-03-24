import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { randomBytes } from 'crypto'

import { api } from "./services/api";

jest.mock("./services/api");

type ApiMock = typeof api & {
  get: jest.Mock;
  post: jest.Mock;
}

const apiMock: ApiMock = api as ApiMock;

describe('Integration test', () => {
  beforeEach(() => {
    render(<div id="root" />);
  })

  it('List transactions with formatted data', async () => {
    apiMock.get.mockImplementation(async () => ({
      data: {
        transactions: [
          {
            id: 1,
            title: 'Freelance de website',
            type: 'deposit',
            category: 'Dev',
            amount: 6000,
            createdAt: new Date('2021-02-12 09:00:00')
          },
          {
            id: 2,
            title: 'Aluguel',
            type: 'withdraw',
            category: 'Casa',
            amount: 1100,
            createdAt: new Date('2021-02-14 11:00:00')
          },
        ]
      }
    }))

    const { App } = await import('./App')

    render(<App />);

    await waitFor(() => {
      expect(apiMock.get).toHaveBeenCalledTimes(1);
    })

    const table = screen.getByRole('table').querySelector('tbody')

    const [firstRow, secondRow] = Array.from(table?.querySelectorAll('tr') || []);

    expect(within(firstRow).getByText('Freelance de website')).toBeInTheDocument()
    expect(within(firstRow).getByText('R$ 6.000,00')).toBeInTheDocument()
    expect(within(firstRow).getByText('12/02/2021')).toBeInTheDocument()

    expect(within(secondRow).getByText('Aluguel')).toBeInTheDocument()
    expect(within(secondRow).getByText('R$ 1.100,00')).toBeInTheDocument()
    expect(within(secondRow).getByText('14/02/2021')).toBeInTheDocument()
  })

  it('Create new transactions', async () => {
    apiMock.get.mockImplementation(async () => ({ data: { transactions: [] } }))
    apiMock.post.mockImplementation(async (_, data) => ({ data: { transaction: { ...data, id: randomBytes(5) } } }))

    const { App } = await import('./App')

    render(<App />);

    await waitFor(() => {
      expect(apiMock.get).toHaveBeenCalledTimes(1);
    })

    userEvent.click(screen.getByRole('button', { name: 'Nova transação' }))

    userEvent.type(screen.getByLabelText('title'), 'Transação de teste')
    userEvent.type(screen.getByLabelText('value'), '200')
    userEvent.type(screen.getByLabelText('category'), 'Categoria ABC')

    userEvent.click(screen.getByRole('button', { name: 'Cadastrar' }))


    const table = screen.getByRole('table').querySelector('tbody')

    await waitFor(() => {
      const [firstRow] = Array.from(table?.querySelectorAll('tr') || []);

      expect(firstRow).toBeInTheDocument()
      expect(within(firstRow).getByText('Transação de teste')).toBeInTheDocument()
      expect(within(firstRow).getByText('R$ 200,00')).toBeInTheDocument()
      expect(within(firstRow).getByText('Categoria ABC')).toBeInTheDocument()
    })
  })

  it('Should calculate correct incoming and outcoming', async () => {
    apiMock.get.mockImplementation(async () => ({
      data: {
        transactions: [
          {
            id: 1,
            title: 'Transaction 1',
            type: 'deposit',
            category: 'Dev',
            amount: 500,
            createdAt: new Date('2021-02-12 09:00:00')
          },
          {
            id: 2,
            title: 'Transaction 2',
            type: 'deposit',
            category: 'Dev',
            amount: 750,
            createdAt: new Date('2021-02-12 09:00:00')
          },
          {
            id: 3,
            title: 'Transaction 3',
            type: 'withdraw',
            category: 'Dev',
            amount: 125,
            createdAt: new Date('2021-02-12 09:00:00')
          },
          {
            id: 4,
            title: 'Transaction 4',
            type: 'withdraw',
            category: 'Dev',
            amount: 50,
            createdAt: new Date('2021-02-12 09:00:00')
          },
        ]
      }
    }))

    const { App } = await import('./App')

    render(<App />);

    await waitFor(() => {
      expect(apiMock.get).toHaveBeenCalledTimes(1);
    })

    expect(screen.getByText('R$ 1.250,00')).toBeInTheDocument()
    expect(screen.getByText('- R$ 175,00')).toBeInTheDocument()
    expect(screen.getByText('R$ 1.075,00')).toBeInTheDocument()
  })
})

export { }