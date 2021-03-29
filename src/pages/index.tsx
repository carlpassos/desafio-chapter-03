import { GetStaticProps } from 'next';
import Link from 'next/link';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import { FiCalendar, FiUser } from 'react-icons/fi';

import Head from 'next/head';

import Prismic from '@prismicio/client';
// import { RichText } from 'prismic-dom';

import { useCallback, useState } from 'react';
import { getPrismicClient } from '../services/prismic';

// import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const [posts, setPosts] = useState<PostPagination>(postsPagination);
  const [loading, setLoading] = useState<boolean>(false);

  const loadMorePosts = useCallback(async () => {
    setLoading(true);
    const postsResponse = await fetch(posts.next_page).then(response =>
      response.json()
    );

    const results = postsResponse.results.map(post => {
      const date = format(
        new Date(post.first_publication_date),
        'dd MMM yyyy',
        {
          locale: ptBR,
        }
      );
      return {
        uid: post.uid,
        first_publication_date: date,
        data: {
          title: post.data.title,
          subtitle: post.data.subtitle,
          author: post.data.author,
        },
      };
    });

    setPosts({
      results: [...posts.results, ...results],
      next_page: postsResponse.next_page,
    });

    setLoading(false);
  }, [posts]);

  return (
    <>
      <Head>
        <title>Spacetraveling</title>
      </Head>

      <main className={styles.container}>
        <header className={styles.header}>
          <img src="/Logo.svg" alt="logo" />
        </header>
        <div className={styles.content}>
          {posts.results.map(post => (
            <Link href={`/post/${post.uid}`} key={post.uid}>
              <div className={styles.post}>
                <h2>{post.data.title}</h2>
                <span>{post.data.subtitle}</span>
                <div>
                  <span>
                    <FiCalendar />
                    <span>{post.first_publication_date}</span>
                  </span>
                  <span>
                    <FiUser />
                    <span>{post.data.author}</span>
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
        {posts.next_page && (
          <button
            type="button"
            className={styles.loadMore}
            onClick={loadMorePosts}
            value="Carregar mais posts"
          >
            Carregar mais posts
          </button>
        )}
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();

  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'p')],
    {
      fetch: ['post.title', 'post.subtitle', 'post.author'],
      pageSize: 2,
    }
  );

  const posts = postsResponse.results.map(post => {
    const date = format(new Date(post.first_publication_date), 'dd MMM yyyy', {
      locale: ptBR,
    });

    return {
      uid: post.uid,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
      first_publication_date: date,
    };
  });

  return {
    props: {
      postsPagination: {
        next_page: postsResponse.next_page,
        results: posts,
      },
    },
  };
};
