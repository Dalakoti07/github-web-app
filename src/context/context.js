import React, { useState, useEffect } from 'react';
import mockUser from './mockData.js/mockUser';
import mockRepos from './mockData.js/mockRepos';
import mockFollowers from './mockData.js/mockFollowers';
import axios from 'axios';
import Followers from '../components/Followers';

const rootUrl = 'https://api.github.com';

const GithubContext=React.createContext()

const GithubProvider=({children})=>{
    const [githubUser,setGithubUser]=useState(mockUser);
    const [repos,setRepos]=useState(mockRepos);
    const [followers,setFollowers]=useState(mockFollowers);

    // requests, loading
    const [requests,setRequests]=useState(0);
    const [isLoading,setIsLoading]=useState(false);
    const [error,setError]=useState({show:false,msg:""});

    const searchGithubUser=async (user)=>{
        setIsLoading(true);
        console.log(user);
        toggleError()
        const reponse=await axios(`${rootUrl}/users/${user}`)
            .catch((err)=> console.log(err))
        if(reponse){
            setGithubUser(reponse.data)
            const {login,followers_url}=reponse.data;

            await Promise.allSettled([
            axios(`${rootUrl}/users/${login}/repos?per_page=100`),
            axios(`${followers_url}?per_page=100`)
            ]).then(result=> {
                const [repos,followers]=result;
                const status='fulfilled';
                if(repos.status===status)
                    setRepos(repos.value.data)
                if(followers.status===status)
                    setFollowers(followers.value.data)
            }).catch(err=>console.log(err))
        }
        else
            toggleError(true,'There is no user with such username')
        checkRequests()
        setIsLoading(false)
    }

    //check rate
    const checkRequests=()=>{
        axios(`${rootUrl}/rate_limit`)
            .then(({data})=>{
                console.log(data)
                let{rate:{remaining}}=data
                setRequests(remaining)
                if(remaining===0){
                    toggleError(true,"Sorry, you have exceeded your hourly rate limit!")
                }
            })
            .catch((err)=>console.log(err))
    }
    function toggleError(show,msg){
        setError({show,msg});
    }

    useEffect(checkRequests,[]);

    return (
        <GithubContext.Provider value={{
            githubUser,repos,followers,requests
            ,error,searchGithubUser,isLoading
        }}>
            {children}
        </GithubContext.Provider>
    );
}

export {GithubProvider,GithubContext};