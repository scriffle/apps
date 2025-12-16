#include <stdio.h>#include <stdlib.h>#include <string.h>#define kMaxChars	48#define kNumWords	102100struct words{  char word[kMaxChars],pron[kMaxChars];}wordList[kNumWords],pronList[kNumWords]; int main( void ) {	long 		bigloop, count,c,d,p,max,min,result, result1, result2, lastDiff,wordc,pronc;	char 		str [255],word[255],pron[255],query[255],swappron1[255],swappron2[255],aux;	FILE		*pw,*wp,*output;				wp = fopen("words pron.txt", "r");	if(wp == NULL)	{		printf("\nCannot open words pron.txt\n");		exit(0);	}		pw = fopen("pron words.txt", "r");	if(pw == NULL)	{		printf("\nCannot open pron words.txt\n");		exit(0);	}	
	output = fopen("output.txt", "w");	if(output == NULL)	{		printf("\nCannot open output.txt\n");		exit(0);	}
	
	c=0;		while(!feof(wp))	//	load the words	{		//	load the words		fgets(str,kMaxChars,wp);		//	get the entry		sscanf(str,"%s",&word);			//	get the word		sscanf(&str[strlen(word)],"%s",&pron);		//	get the pronunciation		strcpy(wordList[c].word,word);		strcpy(wordList[c].pron,pron);				//	load the pronunciations		fgets(str,kMaxChars,pw);		//	get the entry		sscanf(str,"%s",&pron);			//	get the pronunciation		sscanf(&str[strlen(pron)],"%s",&word);		//	get the word		strcpy(pronList[c].pron,pron);		strcpy(pronList[c].word,word);		c++;		if (c>=kNumWords) break;	}	printf("loaded\n");	if(wp != NULL)		fclose(wp);	if(pw != NULL)		fclose(pw);			//	next word
	c=rand()%kNumWords;
		strcpy(query,wordList[c].word);
		//	convert to upper	for(c=0;c<(strlen(query));c++){		if((query[c]>='a')&&(query[c]<='z')) query[c]-=32;	}	printf("searching for %s\n",query);		//	is the word in the word list?
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
	
	//	search for spoonerisms
	for(count=0; count <kNumWords; count++){
		//	get the prons
		strcpy(swappron1,wordList[wordc].pron);
		strcpy(swappron2,wordList[count].pron);
		//swap the prons
		//printf("%s	%s\n", swappron1, swappron2);
		
		//avoid same phoneme
		if(swappron1[0]!=swappron2[0])
		{
			aux = swappron1[0];
			swappron1[0] = swappron2[0];
			swappron2[0] = aux;
			//printf("%s	%s\n\n", swappron1, swappron2);
		
			// Look for first pron
			c=0;
			do{				c++;
				result1 = strcmp(swappron1,pronList[c].pron);			}while((result1!=0)&&(c<kNumWords));
			if(result1==0){
				// look for the second pron
				d=0;
				do{
					d++;
					result2=strcmp(swappron2,pronList[d].pron);				}while((result2!=0)&&(d<kNumWords));
				if(result2==0){	
					printf("%s, %s \n",pronList[c].word, pronList[d].word);
				} else ;
			} else ;
		}
	}
	printf("complete\n");
	return 0;}