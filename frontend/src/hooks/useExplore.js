import { useState, useEffect, useCallback } from 'react';
import { getCategories, getTrendingHashtags, getFeaturedCreators, globalSearch } from '../services/exploreService';
import { debounce } from '../utils/helpers';

export function useExplore(initialQuery = '') {
    const [categories, setCategories] = useState([]);
    const [hashtags, setHashtags] = useState([]);
    const [creators, setCreators] = useState([]);
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searching, setSearching] = useState(false);
    const [query, setQuery] = useState(initialQuery);
    const [activeTab, setActiveTab] = useState('all');

    useEffect(() => {
        Promise.all([getCategories(), getTrendingHashtags(), getFeaturedCreators()])
            .then(([c, h, cr]) => {
                setCategories(c.data.categories);
                setHashtags(h.data.hashtags);
                setCreators(cr.data.creators);
            })
            .finally(() => setLoading(false));
    }, []);

    const doSearch = useCallback(async (q) => {
        if (!q.trim()) { setResults(null); return; }
        setSearching(true);
        try {
            const res = await globalSearch({ q });
            setResults(res.data);
        } finally {
            setSearching(false);
        }
    }, []);

    // debounce 400ms khi gõ
    const debouncedSearch = useCallback(debounce(doSearch, 400), [doSearch]);

    const handleQueryChange = (q) => {
        setQuery(q);
        if (!q.trim()) setResults(null);
        else debouncedSearch(q);
    };

    const clearSearch = () => { setQuery(''); setResults(null); };

    return {
        categories, hashtags, creators, results,
        loading, searching, query, activeTab,
        setActiveTab, handleQueryChange, clearSearch, doSearch,
    };
}