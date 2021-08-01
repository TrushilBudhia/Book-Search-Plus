import React from 'react';
import { Jumbotron, Container, CardColumns, Card, Button } from 'react-bootstrap';
// Importing the `useQuery()` and 'useMutation()' hooks from @apollo/client
import { useQuery, useMutation } from '@apollo/client';
import Auth from '../utils/auth';
import { removeBookId } from '../utils/localStorage';
import { GET_ME } from '../utils/queries';
import { REMOVE_BOOK } from '../utils/mutations';

const SavedBooks = () => {
  // Setting up useMutation
  const [removeBook, { error }] = useMutation(REMOVE_BOOK);
  // Setting up useQuery
  const { loading, data } = useQuery(GET_ME);
  const userData = data?.me || {};


  // Create function that accepts the book's mongo _id value as param and deletes the book from the database
  const handleDeleteBook = async (bookId) => {
    const token = Auth.loggedIn() ? Auth.getToken() : null;

    if (!token) {
      return false;
    }

    try {
      const {data} = await removeBook({ 
        variables: { bookId }
      },
      {
        // Removing the deleted book from cache
        update: cache => {
          const data = cache.readQuery({ query: GET_ME })
          const userProfileData = data.me
          const savedCache = userProfileData.savedBooks
          const updatedCache = savedCache.filter((bookItem) => bookItem.bookId !== bookId)
          userProfileData.savedBooks = updatedCache
          cache.writeQuery({ 
            query: GET_ME, 
            data: { data: { ...userProfileData.savedBooks } } })
        }
      })
      console.log('data', data)

      if (error) {
        throw new Error('Something went wrong!');
      }

      // Upon success, remove book's id from localStorage
      removeBookId(bookId);
    } catch (err) {
      console.error(err);
    }
  };

  // If data isn't here yet, say so
  if (loading) {
    return <h2>LOADING...</h2>;
  }

  return (
    <>
      <Jumbotron fluid className='text-light bg-dark'>
        <Container>
          <h1>Viewing saved books!</h1>
        </Container>
      </Jumbotron>
      <Container>
        <h2>
          {userData.savedBooks.length
            ? `Viewing ${userData.savedBooks.length} saved ${userData.savedBooks.length === 1 ? 'book' : 'books'}:`
            : 'You have no saved books!'}
        </h2>
        <CardColumns>
          {userData.savedBooks.map((book) => {
            return (
              <Card key={book.bookId} border='dark'>
                {book.image ? <Card.Img src={book.image} alt={`The cover for ${book.title}`} variant='top' /> : null}
                <Card.Body>
                  <Card.Title>{book.title}</Card.Title>
                  <p className='small'>Authors: {book.authors}</p>
                  <Card.Text>{book.description}</Card.Text>
                  <Button className='btn-block btn-danger' onClick={() => handleDeleteBook(book.bookId)}>
                    Delete this Book!
                  </Button>
                </Card.Body>
              </Card>
            );
          })}
        </CardColumns>
      </Container>
    </>
  );
};

export default SavedBooks;
