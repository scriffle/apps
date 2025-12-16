#include <stdio.h>#include <stdlib.h>#include <string.h>#define kMaxChars	128#define kNumWords	127000
#define kLemmas		4380struct words{	char word[kMaxChars],pron[kMaxChars];}wordList[kNumWords],pronList[kNumWords]; 

struct list
{
	char word[kMaxChars];
}lemmas[kLemmas];int main( void ) {	long 		searchPoint,c,d,p,max,min,result, result1, result2, lastDiff,wordc,pronc;	char 		str [255],word[255],pron[255],query[255],swappron1[255],swappron2[255],aux,dictWord[255];	FILE		*dictFP,*lemmasFP,*outputFP;				dictFP = fopen("compacted dict.txt", "r");	if(dictFP == NULL) 	{	printf("\nCannot open dict.txt\n");	exit(0);	}	
	lemmasFP = fopen("4380 lemmas.txt", "r");	if(lemmasFP == NULL) 	{	printf("\nCannot open 4380 lemmas whitelist.txt\n");	exit(0);	}
	
	outputFP = fopen("output.txt", "w");	if(outputFP == NULL) 	{	printf("\nCannot open output.txt\n");	exit(0);	}
	
	// load the lemmas
	c=0;	while(!feof(lemmasFP))	{
		fgets(str,kMaxChars,lemmasFP);		//	get the entry
		str[strlen(str)-1]=0;	// truncate to string length
		strcpy(lemmas[c].word,str);
		//printf("%d %s\n",strlen(whiteList[c].word),whiteList[c].word);
		//	convert whitelist word to upper		for(d=0;d<(strlen(lemmas[c].word));d++){			if((lemmas[c].word[d]>='a')&&(lemmas[c].word[d]<='z')) lemmas[c].word[d]-=32;}			if (c++>=kNumWords) break;
}printf("loaded lemmas\n");
	
	// read the word from the dict
	c=0;	while(!feof(dictFP))	
	{		fgets(str,kMaxChars,dictFP);		//	get the dict entry
		sscanf(str,"%s",&word);			//	get the dict word
		sscanf(&str[strlen(word)],"%s",&pron);		//	get the dict pronunciation		strcpy(wordList[c].word,word);		strcpy(wordList[c].pron,pron);		//printf("%d %s\n",c,wordList[c].pron);
		
		//	is the word in the whitelist?
		strcpy(dictWord,wordList[c].word);
		//printf("searching for %s\n",dictWord);				// search		min=0;		max=kLemmas;		searchPoint=(max-min)/2;		do{			lastDiff = min+((max-min)/2);
			//printf("comparing %s and %s @ %d\n",dictWord,whiteList[searchPoint].word,searchPoint);			result = strcmp(dictWord,lemmas[searchPoint].word);			if(result<0){				max=searchPoint;				searchPoint=min+((max-min)/2);			}else				if(result>0){					min=searchPoint;					searchPoint=min+((max-min)/2);				}		}while((result!=0)&&(searchPoint!=lastDiff));				if(result==0){
			printf("%s %s\n",wordList[c].word,wordList[c].pron);
			fprintf(outputFP,"%s %s\n",wordList[c].word,wordList[c].pron);
			wordc=searchPoint;
		} else printf("");
		
		// finish iteration
		c++;			if (c>=kNumWords) break;	}	
	
		//	next word
	c=rand()%kNumWords;
		strcpy(query,"DUCK");
	outputFP = fopen("DUCK.txt", "w+");	if(outputFP == NULL)	{		printf("\nCannot open output.txt\n");		exit(0);	}		//	is the word in the word list?
	strcpy(word,query);	min=0;	max=kNumWords;	c=(max-min)/2;	do{		lastDiff = min+((max-min)/2);		result = strcmp(word,wordList[c].word);		if(result<0){			max=c;			c=min+((max-min)/2);		}else		if(result>0){			min=c;			c=min+((max-min)/2);		}	}while((result!=0)&&(c!=lastDiff));		if(result==0){
		printf("word found\n");
		wordc=c;
	} else printf("word not found\n");
	
	//find the pron
	//	is the pron in the pron list?
	strcpy(pron,wordList[wordc].pron);	c=0;	do{		c++;
		result = strcmp(pron,pronList[c].pron);	}while((result!=0)&&(c<kNumWords));	
	if(result==0){
		printf("pron found\n");
		pronc=c;
	} else printf("pron not found\n");
		printf("complete\n");
	return 0;}